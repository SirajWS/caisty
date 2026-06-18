import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  PAID_REVENUE_INVOICE_I_FILTER,
  PAID_REVENUE_STATUS_FILTER,
  parseAnalyticsPreset,
  parseGranularity,
  resolveDateRange,
  type Granularity,
} from "../../lib/analytics.js";

function parseQuery(request: { query: Record<string, unknown> }) {
  const q = request.query as {
    preset?: string;
    from?: string;
    to?: string;
    granularity?: string;
    bucketStart?: string;
    bucketEnd?: string;
  };
  const preset = parseAnalyticsPreset(q.preset);
  const range = resolveDateRange(preset, q.from, q.to);
  const granularity = parseGranularity(preset, q.granularity);
  return {
    ...range,
    granularity,
    bucketStart: q.bucketStart,
    bucketEnd: q.bucketEnd,
    fromSql: range.from.toISOString(),
    toSql: range.to.toISOString(),
  };
}

function truncUnit(granularity: Granularity): string {
  if (granularity === "week") return "week";
  if (granularity === "month") return "month";
  return "day";
}

/**
 * Read-only admin analytics (revenue from paid invoices only).
 */
export async function registerAdminAnalyticsRoutes(app: FastifyInstance) {
  app.get("/admin/analytics/overview", async (request) => {
    const { from, to, preset, fromSql, toSql } = parseQuery(request);

    const [revenueRow] = await db.execute<{
      total_revenue_cents: string;
    }>(sql`
      SELECT coalesce(sum(coalesce(amount_gross_cents, amount_cents, 0)), 0)::bigint AS total_revenue_cents
      FROM invoices
      WHERE ${PAID_REVENUE_STATUS_FILTER}
    `);

    const [rangeRevenueRow] = await db.execute<{ revenue_cents: string }>(sql`
      SELECT coalesce(sum(coalesce(amount_gross_cents, amount_cents, 0)), 0)::bigint AS revenue_cents
      FROM invoices
      WHERE ${PAID_REVENUE_STATUS_FILTER}
      AND coalesce(paid_at, issued_at) >= ${fromSql}
      AND coalesce(paid_at, issued_at) <= ${toSql}
    `);

    const [mrrRow] = await db.execute<{ mrr_cents: string }>(sql`
      SELECT coalesce(sum(
        CASE
          WHEN lower(coalesce(billing_period, 'monthly')) = 'yearly'
            THEN round(price_cents::numeric / 12.0)
          ELSE price_cents
        END
      ), 0)::bigint AS mrr_cents
      FROM subscriptions
      WHERE lower(status) = 'active'
        AND lower(plan) IN ('starter', 'pro')
    `);

    const [activeCustomersRow] = await db.execute<{ count: string }>(sql`
      SELECT count(DISTINCT customer_id)::bigint AS count
      FROM (
        SELECT customer_id::text AS customer_id
        FROM subscriptions
        WHERE lower(status) = 'active'
          AND lower(plan) IN ('starter', 'pro')
        UNION
        SELECT customer_id
        FROM licenses
        WHERE lower(plan) = 'trial'
          AND lower(status) = 'active'
          AND customer_id IS NOT NULL
      ) active_customers
    `);

    const [trialActiveRow] = await db.execute<{ count: string }>(sql`
      SELECT count(DISTINCT customer_id)::bigint AS count
      FROM licenses
      WHERE lower(plan) = 'trial'
        AND lower(status) = 'active'
        AND customer_id IS NOT NULL
    `);

    const [trialEverRow] = await db.execute<{ count: string }>(sql`
      SELECT count(DISTINCT customer_id)::bigint AS count
      FROM licenses
      WHERE lower(plan) = 'trial'
        AND customer_id IS NOT NULL
    `);

    const [trialConvertedRow] = await db.execute<{ count: string }>(sql`
      SELECT count(DISTINCT t.customer_id)::bigint AS count
      FROM (
        SELECT DISTINCT customer_id
        FROM licenses
        WHERE lower(plan) = 'trial' AND customer_id IS NOT NULL
      ) t
      WHERE EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.customer_id::text = t.customer_id
          AND ${PAID_REVENUE_INVOICE_I_FILTER}
      )
      OR EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.customer_id::text = t.customer_id
          AND lower(s.status) = 'active'
          AND lower(s.plan) IN ('starter', 'pro')
      )
    `);

    const [churnRow] = await db.execute<{
      new_customers: string;
      lost_customers: string;
    }>(sql`
      SELECT
        (SELECT count(*)::bigint FROM customers c
          WHERE c.created_at >= ${fromSql} AND c.created_at <= ${toSql}) AS new_customers,
        (SELECT count(DISTINCT s.customer_id)::bigint FROM subscriptions s
          WHERE s.canceled_at IS NOT NULL
            AND s.canceled_at >= ${fromSql}
            AND s.canceled_at <= ${toSql}) AS lost_customers
    `);

    const mrrCents = Number(mrrRow?.mrr_cents ?? 0);
    const trialEver = Number(trialEverRow?.count ?? 0);
    const trialConverted = Number(trialConvertedRow?.count ?? 0);
    const newCustomers = Number(churnRow?.new_customers ?? 0);
    const lostCustomers = Number(churnRow?.lost_customers ?? 0);

    return {
      ok: true,
      preset,
      from: from.toISOString(),
      to: to.toISOString(),
      currency: "EUR",
      totalRevenueCents: Number(revenueRow?.total_revenue_cents ?? 0),
      rangeRevenueCents: Number(rangeRevenueRow?.revenue_cents ?? 0),
      mrrCents,
      arrCents: mrrCents * 12,
      activeCustomers: Number(activeCustomersRow?.count ?? 0),
      trialCustomersActive: Number(trialActiveRow?.count ?? 0),
      trialCustomersEver: trialEver,
      trialConverted,
      trialConversionRate:
        trialEver > 0 ? Math.round((trialConverted / trialEver) * 1000) / 10 : 0,
      churn: {
        newCustomers,
        lostCustomers,
        net: newCustomers - lostCustomers,
      },
    };
  });

  app.get("/admin/analytics/revenue", async (request) => {
    const { from, to, preset, granularity, bucketStart, fromSql, toSql } =
      parseQuery(request);
    const unit = truncUnit(granularity);

    const buckets = await db.execute<{
      period_start: Date;
      revenue_cents: string;
      invoice_count: string;
    }>(sql`
      SELECT
        date_trunc(${unit}, coalesce(paid_at, issued_at)) AS period_start,
        coalesce(sum(coalesce(amount_gross_cents, amount_cents, 0)), 0)::bigint AS revenue_cents,
        count(*)::bigint AS invoice_count
      FROM invoices
      WHERE ${PAID_REVENUE_STATUS_FILTER}
      AND coalesce(paid_at, issued_at) >= ${fromSql}
      AND coalesce(paid_at, issued_at) <= ${toSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    let drillInvoices:
      | Array<{
          id: string;
          number: string;
          customerName: string;
          customerEmail: string;
          amountGrossCents: number;
          paidAt: string | null;
        }>
      | undefined;

    if (bucketStart) {
      const bStart = new Date(bucketStart);
      const bEnd = new Date(bStart);
      if (unit === "day") bEnd.setDate(bEnd.getDate() + 1);
      else if (unit === "week") bEnd.setDate(bEnd.getDate() + 7);
      else bEnd.setMonth(bEnd.getMonth() + 1);

      const bStartSql = bStart.toISOString();
      const bEndSql = bEnd.toISOString();

      const rows = await db.execute<{
        id: string;
        number: string;
        customer_name: string | null;
        customer_email: string | null;
        amount_gross_cents: number | null;
        amount_cents: number;
        paid_at: Date | null;
      }>(sql`
        SELECT
          i.id::text AS id,
          i.number,
          c.name AS customer_name,
          c.email AS customer_email,
          i.amount_gross_cents,
          i.amount_cents,
          i.paid_at
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        WHERE ${PAID_REVENUE_INVOICE_I_FILTER}
        AND coalesce(i.paid_at, i.issued_at) >= ${bStartSql}
        AND coalesce(i.paid_at, i.issued_at) < ${bEndSql}
        ORDER BY coalesce(i.paid_at, i.issued_at) DESC
        LIMIT 500
      `);

      drillInvoices = rows.map((r) => ({
        id: r.id,
        number: r.number,
        customerName: r.customer_name ?? "—",
        customerEmail: r.customer_email ?? "—",
        amountGrossCents: r.amount_gross_cents ?? r.amount_cents ?? 0,
        paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null,
      }));
    }

    return {
      ok: true,
      preset,
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      buckets: buckets.map((b) => ({
        periodStart: new Date(b.period_start).toISOString(),
        revenueCents: Number(b.revenue_cents),
        invoiceCount: Number(b.invoice_count),
      })),
      invoices: drillInvoices,
    };
  });

  app.get("/admin/analytics/plans", async (request) => {
    const { from, to, preset, fromSql, toSql } = parseQuery(request);

    const subCounts = await db.execute<{
      plan: string;
      billing_period: string | null;
      customer_count: string;
    }>(sql`
      SELECT
        lower(plan) AS plan,
        lower(coalesce(billing_period, 'monthly')) AS billing_period,
        count(DISTINCT customer_id)::bigint AS customer_count
      FROM subscriptions
      WHERE lower(status) = 'active'
        AND lower(plan) IN ('starter', 'pro')
      GROUP BY 1, 2
    `);

    const [trialCountRow] = await db.execute<{ count: string }>(sql`
      SELECT count(DISTINCT customer_id)::bigint AS count
      FROM licenses
      WHERE lower(plan) = 'trial'
        AND lower(status) = 'active'
        AND customer_id IS NOT NULL
    `);

    const revenueByPlan = await db.execute<{
      plan_key: string;
      revenue_cents: string;
    }>(sql`
      SELECT
        CASE
          WHEN lower(coalesce(s.plan, lower(i.plan_name))) = 'starter'
            AND lower(coalesce(i.billing_period, s.billing_period, 'monthly')) = 'yearly'
            THEN 'starter_yearly'
          WHEN lower(coalesce(s.plan, lower(i.plan_name))) = 'starter'
            THEN 'starter_monthly'
          WHEN lower(coalesce(s.plan, lower(i.plan_name))) = 'pro'
            AND lower(coalesce(i.billing_period, s.billing_period, 'monthly')) = 'yearly'
            THEN 'pro_yearly'
          WHEN lower(coalesce(s.plan, lower(i.plan_name))) = 'pro'
            THEN 'pro_monthly'
          ELSE 'other'
        END AS plan_key,
        coalesce(sum(coalesce(i.amount_gross_cents, i.amount_cents, 0)), 0)::bigint AS revenue_cents
      FROM invoices i
      LEFT JOIN subscriptions s ON s.id = i.subscription_id
      WHERE ${PAID_REVENUE_INVOICE_I_FILTER}
      AND coalesce(i.paid_at, i.issued_at) >= ${fromSql}
      AND coalesce(i.paid_at, i.issued_at) <= ${toSql}
      GROUP BY 1
    `);

    const revenueMap = new Map<string, number>();
    for (const r of revenueByPlan) {
      revenueMap.set(r.plan_key, Number(r.revenue_cents));
    }

    const countMap = new Map<string, number>();
    for (const r of subCounts) {
      const key = `${r.plan}_${r.billing_period}`;
      countMap.set(key, Number(r.customer_count));
    }

    const plans = [
      {
        key: "trial",
        label: "Trial",
        customerCount: Number(trialCountRow?.count ?? 0),
        revenueCents: 0,
      },
      {
        key: "starter_monthly",
        label: "Starter Monthly",
        customerCount: countMap.get("starter_monthly") ?? 0,
        revenueCents: revenueMap.get("starter_monthly") ?? 0,
      },
      {
        key: "starter_yearly",
        label: "Starter Yearly",
        customerCount: countMap.get("starter_yearly") ?? 0,
        revenueCents: revenueMap.get("starter_yearly") ?? 0,
      },
      {
        key: "pro_monthly",
        label: "Pro Monthly",
        customerCount: countMap.get("pro_monthly") ?? 0,
        revenueCents: revenueMap.get("pro_monthly") ?? 0,
      },
      {
        key: "pro_yearly",
        label: "Pro Yearly",
        customerCount: countMap.get("pro_yearly") ?? 0,
        revenueCents: revenueMap.get("pro_yearly") ?? 0,
      },
    ];

    return { ok: true, preset, from: from.toISOString(), to: to.toISOString(), plans };
  });

  app.get("/admin/analytics/customers", async (request) => {
    const { from, to, preset, granularity, fromSql, toSql } = parseQuery(request);
    const unit = truncUnit(granularity);

    const buckets = await db.execute<{
      period_start: Date;
      new_customers: string;
    }>(sql`
      SELECT
        date_trunc(${unit}, created_at) AS period_start,
        count(*)::bigint AS new_customers
      FROM customers
      WHERE created_at >= ${fromSql} AND created_at <= ${toSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    let cumulative = 0;
    const [beforeRow] = await db.execute<{ count: string }>(sql`
      SELECT count(*)::bigint AS count FROM customers WHERE created_at < ${fromSql}
    `);
    cumulative = Number(beforeRow?.count ?? 0);

    return {
      ok: true,
      preset,
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      buckets: buckets.map((b) => {
        cumulative += Number(b.new_customers);
        return {
          periodStart: new Date(b.period_start).toISOString(),
          newCustomers: Number(b.new_customers),
          cumulativeTotal: cumulative,
        };
      }),
    };
  });

  app.get("/admin/analytics/subscriptions", async (request) => {
    const { from, to, preset, granularity, fromSql, toSql } = parseQuery(request);
    const unit = truncUnit(granularity);

    const buckets = await db.execute<{
      period_start: Date;
      new_subscriptions: string;
      cancelled_subscriptions: string;
    }>(sql`
      SELECT
        p.period_start,
        coalesce(n.cnt, 0)::bigint AS new_subscriptions,
        coalesce(c.cnt, 0)::bigint AS cancelled_subscriptions
      FROM (
        SELECT DISTINCT date_trunc(${unit}, d) AS period_start
        FROM (
          SELECT created_at AS d FROM subscriptions WHERE created_at >= ${fromSql} AND created_at <= ${toSql}
          UNION ALL
          SELECT canceled_at AS d FROM subscriptions WHERE canceled_at >= ${fromSql} AND canceled_at <= ${toSql}
        ) dates
        WHERE d IS NOT NULL
      ) p
      LEFT JOIN (
        SELECT date_trunc(${unit}, created_at) AS period_start, count(*) AS cnt
        FROM subscriptions
        WHERE created_at >= ${fromSql} AND created_at <= ${toSql}
        GROUP BY 1
      ) n ON n.period_start = p.period_start
      LEFT JOIN (
        SELECT date_trunc(${unit}, canceled_at) AS period_start, count(*) AS cnt
        FROM subscriptions
        WHERE canceled_at >= ${fromSql} AND canceled_at <= ${toSql}
        GROUP BY 1
      ) c ON c.period_start = p.period_start
      ORDER BY p.period_start ASC
    `);

    const [activeBefore] = await db.execute<{ count: string }>(sql`
      SELECT count(*)::bigint AS count FROM subscriptions
      WHERE lower(status) = 'active'
        AND created_at < ${fromSql}
        AND (canceled_at IS NULL OR canceled_at >= ${fromSql})
    `);

    let activeRunning = Number(activeBefore?.count ?? 0);

    return {
      ok: true,
      preset,
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      buckets: buckets.map((b) => {
        const newSubs = Number(b.new_subscriptions);
        const cancelled = Number(b.cancelled_subscriptions);
        activeRunning += newSubs - cancelled;
        return {
          periodStart: new Date(b.period_start).toISOString(),
          newSubscriptions: newSubs,
          cancelledSubscriptions: cancelled,
          activeAtEnd: Math.max(0, activeRunning),
        };
      }),
    };
  });
}
