import type { FastifyInstance } from "fastify";

import { countryConfigService } from "../countryConfig/CountryConfigService.js";
import { toCountryConfigPublic } from "../countryConfig/types.js";

export async function registerCountryConfigRoutes(app: FastifyInstance) {
  app.get("/country-config", async () => {
    const items = countryConfigService
      .listAll()
      .map(toCountryConfigPublic);
    return { ok: true, items };
  });

  app.get<{ Params: { code: string } }>(
    "/country-config/:code",
    async (request, reply) => {
      const code = request.params.code?.trim().toUpperCase();
      if (!code) {
        reply.code(400);
        return { ok: false, error: "invalid_code" };
      }

      const entry = countryConfigService.getByCode(code, request.log);
      if (!countryConfigService.isKnownCode(code)) {
        reply.code(404);
        return { ok: false, error: "country_not_found", fallback: toCountryConfigPublic(entry) };
      }

      return { ok: true, country: toCountryConfigPublic(entry) };
    },
  );
}
