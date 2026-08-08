import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "99999999-9999-9999-9999-999999999999";
const CUSTOMER_A = "22222222-2222-2222-2222-222222222222";

const mocks = vi.hoisted(() => ({
  listPortalChannels: vi.fn(),
  getPortalChannel: vi.fn(),
  createPortalChannel: vi.fn(),
  updatePortalChannel: vi.fn(),
  deletePortalChannel: vi.fn(),
  importPortalChannelsMerge: vi.fn(),
  importPortalChannelsReplace: vi.fn(),
  exportPortalChannels: vi.fn(),
  verifyPortalToken: vi.fn(),
}));

vi.mock("../../lib/portalChannelService.js", () => ({
  listPortalChannels: mocks.listPortalChannels,
  getPortalChannel: mocks.getPortalChannel,
  createPortalChannel: mocks.createPortalChannel,
  updatePortalChannel: mocks.updatePortalChannel,
  deletePortalChannel: mocks.deletePortalChannel,
  importPortalChannelsMerge: mocks.importPortalChannelsMerge,
  importPortalChannelsReplace: mocks.importPortalChannelsReplace,
  exportPortalChannels: mocks.exportPortalChannels,
}));

vi.mock("../../lib/portalJwt.js", () => ({
  verifyPortalToken: mocks.verifyPortalToken,
}));

import { registerPortalChannelsRoutes } from "../portal-channels.js";

function authHeader() {
  return { authorization: "Bearer test-token" };
}

describe("portal channel routes", () => {
  const app = Fastify();

  beforeAll(async () => {
    await registerPortalChannelsRoutes(app);
    await app.ready();
    mocks.verifyPortalToken.mockReturnValue({
      customerId: CUSTOMER_A,
      orgId: ORG_A,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("requires portal auth for list", async () => {
    const res = await app.inject({ method: "GET", url: "/portal/channels" });
    expect(res.statusCode).toBe(401);
  });

  it("lists channels for authenticated org", async () => {
    mocks.listPortalChannels.mockResolvedValueOnce([
      { id: "ch-1", slug: "uber", name: "Uber", orgId: ORG_A },
    ]);

    const res = await app.inject({
      method: "GET",
      url: "/portal/channels",
      headers: authHeader(),
    });

    expect(res.statusCode).toBe(200);
    expect(mocks.listPortalChannels).toHaveBeenCalledWith({
      customerId: CUSTOMER_A,
      orgId: ORG_A,
    });
  });

  it("rejects body orgId on create", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/portal/channels",
      headers: { ...authHeader(), "content-type": "application/json" },
      payload: { orgId: ORG_B, name: "X", slug: "x", enabled: true },
    });

    expect(res.statusCode).toBe(403);
    expect(mocks.createPortalChannel).not.toHaveBeenCalled();
  });

  it("returns 404 for foreign channel read", async () => {
    mocks.getPortalChannel.mockResolvedValueOnce({
      ok: false,
      code: "CHANNEL_NOT_FOUND",
      message: "Channel not found.",
    });

    const res = await app.inject({
      method: "GET",
      url: "/portal/channels/00000000-0000-0000-0000-000000000001",
      headers: authHeader(),
    });

    expect(res.statusCode).toBe(404);
  });

  it("requires merge confirmation for import", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/portal/channels/import",
      headers: { ...authHeader(), "content-type": "application/json" },
      payload: {
        channels: [{ name: "Uber", slug: "uber", enabled: true, provider: "other" }],
      },
    });

    expect(res.statusCode).toBe(422);
    expect(mocks.importPortalChannelsMerge).not.toHaveBeenCalled();
  });

  it("accepts direct channel objects in HTTP import body with merge=true", async () => {
    mocks.importPortalChannelsMerge.mockResolvedValueOnce({
      ok: true,
      data: {
        channels: [{ id: "ch-1", slug: "postman", name: "Fake Provider", orgId: ORG_A }],
        added: 1,
        updated: 0,
        unchanged: 0,
        keptExisting: 0,
        strippedSecretPaths: [],
        secretImportNotice: "",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/portal/channels/import",
      headers: { ...authHeader(), "content-type": "application/json" },
      payload: {
        merge: true,
        channels: [
          {
            name: "Fake Provider",
            slug: "postman",
            provider: "other",
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(mocks.importPortalChannelsMerge).toHaveBeenCalledWith(
      { customerId: CUSTOMER_A, orgId: ORG_A },
      [
        {
          name: "Fake Provider",
          slug: "postman",
          provider: "other",
        },
      ],
    );
  });

  it("accepts legacy replace=true flag as merge confirmation", async () => {
    mocks.importPortalChannelsMerge.mockResolvedValueOnce({
      ok: true,
      data: {
        channels: [],
        added: 0,
        updated: 0,
        unchanged: 0,
        keptExisting: 0,
        strippedSecretPaths: [],
        secretImportNotice: "",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/portal/channels/import",
      headers: { ...authHeader(), "content-type": "application/json" },
      payload: {
        replace: true,
        channels: [{ name: "Uber", slug: "uber", enabled: true, provider: "other" }],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(mocks.importPortalChannelsMerge).toHaveBeenCalled();
  });
});
