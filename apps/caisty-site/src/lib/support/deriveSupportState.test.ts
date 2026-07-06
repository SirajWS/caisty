import { describe, expect, it } from "vitest";
import {
  deriveSupportState,
  sortSupportMessages,
  supportMessageLastUpdate,
} from "./deriveSupportState";
import { portalEn } from "../translations/portal/en";

const baseCustomer = {
  id: "c1",
  orgId: "o1",
  name: "Alex",
  email: "alex@test.com",
  portalStatus: "active" as const,
  primaryLicense: {
    id: "l1",
    key: "KEY",
    plan: "starter",
    status: "active",
    validUntil: null,
  },
};

describe("deriveSupportState", () => {
  it("counts open requests from real message data", () => {
    const state = deriveSupportState({
      customer: baseCustomer,
      messages: [
        {
          id: "1",
          subject: "Help",
          message: "Hi",
          status: "open",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
        {
          id: "2",
          subject: "Done",
          message: "Thanks",
          status: "closed",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      messagesLoading: false,
      messagesError: false,
      licenses: [],
      licensesLoading: false,
      devices: [],
      devicesLoading: false,
      business: null,
      businessLoading: false,
      locale: "en-US",
      t: portalEn,
    });

    expect(state.overview.find((k) => k.id === "open")?.value).toBe("1");
    expect(state.remoteSupport.every((r) => r.tone === "coming_soon")).toBe(true);
  });

  it("shows no requests yet when list is empty", () => {
    const state = deriveSupportState({
      customer: baseCustomer,
      messages: [],
      messagesLoading: false,
      messagesError: false,
      licenses: [],
      licensesLoading: false,
      devices: [],
      devicesLoading: false,
      business: null,
      businessLoading: false,
      locale: "en-US",
      t: portalEn,
    });

    expect(state.overview.find((k) => k.id === "last")?.value).toBe(
      portalEn.support.center.noRequestsYet,
    );
  });
});

describe("supportMessageLastUpdate", () => {
  it("prefers repliedAt over createdAt", () => {
    expect(
      supportMessageLastUpdate({
        id: "1",
        subject: "x",
        message: "y",
        status: "closed",
        createdAt: "2026-01-01T00:00:00.000Z",
        repliedAt: "2026-01-03T00:00:00.000Z",
      }),
    ).toBe("2026-01-03T00:00:00.000Z");
  });
});

describe("sortSupportMessages", () => {
  it("sorts newest first", () => {
    const sorted = sortSupportMessages([
      {
        id: "1",
        subject: "a",
        message: "a",
        status: "open",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        subject: "b",
        message: "b",
        status: "open",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    ]);
    expect(sorted[0]?.id).toBe("2");
  });
});
