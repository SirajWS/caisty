// apps/caisty-site/src/lib/selfService.ts
import { createTrialLicense, type PortalLicense } from "./portalApi";

export type TrialResponse =
  | { ok: true; license: PortalLicense }
  | { ok: false; reason: string; message?: string };

export async function startSelfServiceTrial(): Promise<TrialResponse> {
  try {
    const license = await createTrialLicense();
    return { ok: true, license };
  } catch (err: any) {
    return {
      ok: false,
      reason: err?.reason ?? "unknown",
      message:
        err?.message ??
        "Fehler beim Anlegen der Testlizenz. Bitte später erneut versuchen.",
    };
  }
}
