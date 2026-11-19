import { describe, expect, it } from "vitest";

import {
  deriveOnlinePaymentCards,
  deriveOnlineRevenueHeader,
  derivePosPaymentCards,
} from "./derivePaymentSummaryCards";

describe("derivePaymentSummaryCards", () => {
  const dash = "—";

  it("formats POS payment buckets from backend summary", () => {
    const cards = derivePosPaymentCards({
      summary: {
        cashCents: 10000,
        cardCents: 20000,
        voucherCents: 500,
        otherCents: 250,
        currency: "EUR",
      },
      labels: {
        paymentCash: "Cash",
        paymentCard: "Card",
        paymentVoucher: "Voucher",
        paymentOther: "Other",
      },
      locale: "en-US",
      dash,
      hasData: true,
    });

    expect(cards.find((c) => c.id === "cash")?.value).toContain("100");
    expect(cards.find((c) => c.id === "card")?.value).toContain("200");
  });

  it("formats online payment buckets from backend summary", () => {
    const cards = deriveOnlinePaymentCards({
      summary: {
        cashPaidCents: 3000,
        cardPaidCents: 7000,
        onlinePaidCents: 15000,
        pendingCents: 2500,
        currency: "EUR",
      },
      labels: {
        onlineCashPaid: "Cash paid",
        onlineCardPaid: "Card paid",
        onlinePaidOnline: "Paid online",
        onlinePending: "Pending",
        onlinePaidTotal: "Paid total",
      },
      locale: "en-US",
      dash,
      hasData: true,
    });

    expect(cards).toHaveLength(5);
    expect(cards.find((c) => c.id === "pending")?.value).toContain("25");
    expect(cards.find((c) => c.id === "online_paid")?.value).toContain("150");
    expect(cards.find((c) => c.id === "paid_total")?.emphasis).toBe(true);
    expect(cards.find((c) => c.id === "paid_total")?.value).toContain("250");
  });

  it("computes paid total as cash plus card plus paid online", () => {
    const cards = deriveOnlinePaymentCards({
      summary: {
        cashPaidCents: 27500,
        cardPaidCents: 24700,
        onlinePaidCents: 0,
        pendingCents: 11000,
        currency: "EUR",
      },
      labels: {
        onlineCashPaid: "Cash paid",
        onlineCardPaid: "Card paid",
        onlinePaidOnline: "Paid online",
        onlinePending: "Pending",
        onlinePaidTotal: "Paid total",
      },
      locale: "en-US",
      dash,
      hasData: true,
    });

    expect(cards.find((c) => c.id === "paid_total")?.value).toContain("522");
  });

  it("formats empty online payment summaries in the business currency", () => {
    const labels = {
      onlineCashPaid: "Cash paid",
      onlineCardPaid: "Card paid",
      onlinePaidOnline: "Paid online",
      onlinePending: "Pending",
      onlinePaidTotal: "Paid total",
    };
    const cases = [
      ["EUR", "0.00"],
      ["USD", "0.00"],
      ["CHF", "0.00"],
      ["GBP", "0.00"],
      ["MAD", "0.00"],
      ["DZD", "0.00"],
      ["TND", "0.000"],
      ["LYD", "0.000"],
    ] as const;

    for (const [currency, fraction] of cases) {
      const cards = deriveOnlinePaymentCards({
        summary: {
          cashPaidCents: 0,
          cardPaidCents: 0,
          onlinePaidCents: 0,
          pendingCents: 0,
          currency: "EUR",
        },
        fallbackCurrency: currency,
        labels,
        locale: "en-GB",
        dash,
        hasData: true,
      });
      for (const card of cards) {
        expect(card.value).toContain(fraction);
        if (currency !== "EUR") {
          expect(card.value).not.toMatch(/€/);
        }
      }
    }
  });

  it("keeps historical non-zero online currency", () => {
    const cards = deriveOnlinePaymentCards({
      summary: {
        cashPaidCents: 0,
        cardPaidCents: 500,
        onlinePaidCents: 0,
        pendingCents: 0,
        currency: "EUR",
      },
      fallbackCurrency: "TND",
      labels: {
        onlineCashPaid: "Cash paid",
        onlineCardPaid: "Card paid",
        onlinePaidOnline: "Paid online",
        onlinePending: "Pending",
        onlinePaidTotal: "Paid total",
      },
      locale: "en-GB",
      dash,
      hasData: true,
    });
    expect(cards.find((c) => c.id === "card_paid")?.value).toContain("5.00");
    expect(cards.find((c) => c.id === "card_paid")?.value).not.toContain("5.000");
  });

  it("shows dash placeholders while loading or empty", () => {
    const cards = deriveOnlinePaymentCards({
      summary: null,
      labels: {
        onlineCashPaid: "Cash paid",
        onlineCardPaid: "Card paid",
        onlinePaidOnline: "Paid online",
        onlinePending: "Pending",
        onlinePaidTotal: "Paid total",
      },
      locale: "en-US",
      dash,
      hasData: false,
    });

    expect(cards.every((card) => card.value === dash)).toBe(true);
  });

  it("formats online revenue header for payment summary card", () => {
    const header = deriveOnlineRevenueHeader({
      onlineRevenueCents: 385000,
      currency: "TND",
      labels: {
        kpiOnlineRevenue: "Online revenue",
        kpiOnlineRevenueInfo: "Completed online sales only",
      },
      locale: "en-US",
      dash,
      hasData: true,
    });

    expect(header.label).toBe("Online revenue");
    expect(header.value).toContain("385");
    expect(header.subtitle).toBe("Completed online sales only");
  });
});
