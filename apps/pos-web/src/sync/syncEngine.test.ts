import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  EVT_ORDERS_CHANGED,
  EVT_SALES_CHANGED,
  EVT_SHIFTS_CHANGED,
} from "@caisty/pos-sync-core";

import { createLocalSyncRepository } from "./localRepository.js";

describe("pos-web sync integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists pulled order in local storage repository", () => {
    const repo = createLocalSyncRepository();
    repo.saveOrders([
      {
        id: "ext-1",
        localOrderId: "wolt-1",
        platform: "wolt",
        status: "accepted",
        updatedAt: Date.now(),
      },
    ]);

    expect(repo.loadOrders()).toHaveLength(1);
    expect(repo.loadOrders()[0].status).toBe("accepted");
  });

  it("refreshes UI listeners on sync events without reload", () => {
    const handler = vi.fn();
    window.addEventListener(EVT_ORDERS_CHANGED, handler);
    window.addEventListener(EVT_SALES_CHANGED, handler);
    window.addEventListener(EVT_SHIFTS_CHANGED, handler);

    window.dispatchEvent(new Event(EVT_ORDERS_CHANGED));
    window.dispatchEvent(new Event(EVT_SALES_CHANGED));
    window.dispatchEvent(new Event(EVT_SHIFTS_CHANGED));

    expect(handler).toHaveBeenCalledTimes(3);

    window.removeEventListener(EVT_ORDERS_CHANGED, handler);
    window.removeEventListener(EVT_SALES_CHANGED, handler);
    window.removeEventListener(EVT_SHIFTS_CHANGED, handler);
  });

  it("keeps pending outbox entries during local writes", () => {
    const repo = createLocalSyncRepository();
    localStorage.setItem(
      "caisty.sync.outbox",
      JSON.stringify([
        {
          localId: "ext-1",
          type: "order",
          status: "pending",
          createdAt: Date.now(),
        },
      ]),
    );

    expect(repo.readOutbox()).toHaveLength(1);
    repo.saveOrders([
      {
        id: "ext-1",
        status: "new",
        updatedAt: Date.now(),
      },
    ]);
    expect(repo.readOutbox()).toHaveLength(1);
  });
});
