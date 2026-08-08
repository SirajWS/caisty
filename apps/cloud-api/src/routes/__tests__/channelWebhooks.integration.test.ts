import Fastify from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const ORG_ID = "274feef2-3691-4228-91e4-c0d455f8062b";
const DEVICE_ID = "83ef0a61-6c79-487c-b169-51972b3e80f6";
const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";

const channelRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  orgId: ORG_ID,
  customerId: CUSTOMER_ID,
  sourceDeviceId: DEVICE_ID,
  slug: "fake_delivery",
  name: "Fake Delivery",
  enabled: true,
  provider: "other",
  mode: null,
  storeId: null,
  statusMapping: {},
  notes: null,
  logoDataUrl: null,
  configJson: {},
  deletedAt: null,
  clientUpdatedAt: new Date(),
  syncBatchId: null,
  schemaVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  return { mockSelect, mockInsert, mockUpdate, mockDelete };
});

vi.mock("../../db/client.js", () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    delete: mocks.mockDelete,
  },
}));

import { registerChannelWebhooksRoutes } from "../channel-webhooks.js";

function postmanBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "T1786060842435",
    platform: "fake_delivery",
    channel: "fake_delivery",
    source: "online",
    deliveryType: "delivery",
    status: "new",
    total: 27.5,
    items: [{ name: "Burger", qty: 1, price: 27.5 }],
    customer: { name: "Test Customer", phone: "+216 20 000 000" },
    createdAt: "2026-08-07T00:00:42.860Z",
    ...overrides,
  };
}

function mockChannelLookup(row: typeof channelRow | null = channelRow) {
  mocks.mockSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(row ? [row] : []),
    }),
  });
}

function mockExistingOrderLookup(rows: unknown[] = []) {
  mocks.mockSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

function mockLineLookup(rows: unknown[] = []) {
  mocks.mockSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  });
}

describe("POST /webhooks/channels/:slug integration", () => {
  const app = Fastify();

  beforeAll(async () => {
    await registerChannelWebhooksRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("accepts Postman payload without payment fields as pending", async () => {
    mockChannelLookup();
    mockExistingOrderLookup([]);

    const returningOrder = vi.fn().mockResolvedValue([
      {
        id: "733be7dc-05e9-439e-85be-1264a0fb6af2",
        orgId: ORG_ID,
        customerId: CUSTOMER_ID,
        deviceId: DEVICE_ID,
        localOrderId: "T1786060842435",
        providerOrderId: "T1786060842435",
        platform: "fake_delivery",
        status: "new",
        totalCents: 2750,
        currency: "EUR",
        soldAt: new Date("2026-08-07T00:00:42.860Z"),
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mocks.mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: returningOrder }),
    });

    mockLineLookup([]);

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/channels/fake_delivery",
      payload: postmanBody(),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as {
      ok: boolean;
      pullSnapshot: {
        paymentStatus: string | null;
        paymentMethod: string | null;
        paid: boolean;
        paidAt: string | null;
        transactionId: string | null;
        providerPaymentId: string | null;
      };
    };
    expect(body.ok).toBe(true);
    expect(body.pullSnapshot.paymentStatus).toBe("pending");
    expect(body.pullSnapshot.paymentMethod).toBeNull();
    expect(body.pullSnapshot.paid).toBe(false);
    expect(body.pullSnapshot.paidAt).toBeNull();
    expect(body.pullSnapshot.transactionId).toBeNull();
    expect(body.pullSnapshot.providerPaymentId).toBeNull();
  });

  it("keeps card announced but unconfirmed as pending", async () => {
    mockChannelLookup();
    mockExistingOrderLookup([]);

    const returningOrder = vi.fn().mockResolvedValue([
      {
        id: "order-card-pending",
        orgId: ORG_ID,
        customerId: CUSTOMER_ID,
        deviceId: DEVICE_ID,
        localOrderId: "T-card-pending",
        providerOrderId: "T-card-pending",
        platform: "fake_delivery",
        status: "new",
        totalCents: 1000,
        currency: "EUR",
        soldAt: new Date(),
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mocks.mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: returningOrder }),
    });
    mockLineLookup([]);

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/channels/fake_delivery",
      payload: postmanBody({
        id: "T-card-pending",
        paymentMethod: "card",
        payment: { method: "card", status: "pending" },
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as { pullSnapshot: { paymentStatus: string } };
    expect(body.pullSnapshot.paymentStatus).toBe("pending");
  });

  it("stores confirmed provider payment with proof as paid", async () => {
    mockChannelLookup();
    mockExistingOrderLookup([]);

    const returningOrder = vi.fn().mockResolvedValue([
      {
        id: "order-paid-proof",
        orgId: ORG_ID,
        customerId: CUSTOMER_ID,
        deviceId: DEVICE_ID,
        localOrderId: "T-paid-proof",
        providerOrderId: "T-paid-proof",
        platform: "fake_delivery",
        status: "new",
        totalCents: 1000,
        currency: "EUR",
        soldAt: new Date(),
        paymentStatus: "paid",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mocks.mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: returningOrder }),
    });
    mockLineLookup([]);

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/channels/fake_delivery",
      payload: postmanBody({
        id: "T-paid-proof",
        paymentStatus: "paid",
        payment: {
          method: "platform_card",
          status: "paid",
          details: { txnId: "txn_real_1", providerPaymentId: "pp_real_1" },
        },
        paid: true,
        transactionId: "txn_real_1",
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as { pullSnapshot: { paymentStatus: string } };
    expect(body.pullSnapshot.paymentStatus).toBe("paid");
  });

  it("returns 404 when channel slug is unknown", async () => {
    mockChannelLookup(null);

    const res = await app.inject({
      method: "POST",
      url: "/webhooks/channels/unknown_slug",
      payload: postmanBody(),
    });

    expect(res.statusCode).toBe(404);
  });
});
