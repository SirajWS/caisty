import { describe, expect, it } from "vitest";

import {
  isPlatformAdminRoute,
  isPublicUnauthenticatedRoute,
} from "../platformAdminAuth.js";

describe("platform admin route classification", () => {
  it("keeps Portal, POS and billing webhooks public", () => {
    expect(isPublicUnauthenticatedRoute("/portal/login", "POST", "production")).toBe(
      true,
    );
    expect(isPublicUnauthenticatedRoute("/portal/invoices/inv/html", "GET", "production")).toBe(
      true,
    );
    expect(isPublicUnauthenticatedRoute("/devices/bind", "POST", "production")).toBe(
      true,
    );
    expect(isPublicUnauthenticatedRoute("/devices/heartbeat", "POST", "production")).toBe(
      true,
    );
    expect(isPublicUnauthenticatedRoute("/licenses/verify", "POST", "production")).toBe(
      true,
    );
    expect(isPublicUnauthenticatedRoute("/pos/sync/batch", "POST", "production")).toBe(
      true,
    );
    expect(isPublicUnauthenticatedRoute("/webhooks/stripe", "POST", "production")).toBe(
      true,
    );
    expect(
      isPublicUnauthenticatedRoute("/invoices/abc/html", "GET", "production"),
    ).toBe(false);
  });

  it("marks platform-wide admin APIs for Super-Admin only", () => {
    expect(isPlatformAdminRoute("/customers", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/customers/x/status", "PATCH")).toBe(true);
    expect(isPlatformAdminRoute("/customers/x", "DELETE")).toBe(true);
    expect(isPlatformAdminRoute("/devices", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/licenses", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/licenses/l1/revoke", "POST")).toBe(true);
    expect(isPlatformAdminRoute("/licenses/l1", "DELETE")).toBe(true);
    expect(isPlatformAdminRoute("/licenses/portal", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/subscriptions", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/invoices/abc/html", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/payments", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/webhooks", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/admin/analytics/overview", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/admin/notifications", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/admin/fiscal/overview", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/admin/devices/d1", "DELETE")).toBe(true);
    expect(isPlatformAdminRoute("/admin/devices/d1/archive", "POST")).toBe(true);
    expect(isPlatformAdminRoute("/admin/devices/d1/unarchive", "POST")).toBe(true);
    expect(isPlatformAdminRoute("/devices", "GET")).toBe(true);
    expect(isPlatformAdminRoute("/admin/receipts", "GET")).toBe(true);
  });

  it("does not treat POS or Portal routes as platform admin", () => {
    expect(isPlatformAdminRoute("/devices/bind", "POST")).toBe(false);
    expect(isPlatformAdminRoute("/devices/heartbeat", "POST")).toBe(false);
    expect(isPlatformAdminRoute("/licenses/verify", "POST")).toBe(false);
    expect(isPlatformAdminRoute("/portal/invoices/abc/html", "GET")).toBe(false);
    expect(isPlatformAdminRoute("/portal/receipts", "GET")).toBe(false);
    expect(isPlatformAdminRoute("/webhooks/stripe", "POST")).toBe(false);
    expect(isPlatformAdminRoute("/admin/auth/login", "POST")).toBe(false);
    expect(isPlatformAdminRoute("/admin/auth/me", "GET")).toBe(false);
  });
});
