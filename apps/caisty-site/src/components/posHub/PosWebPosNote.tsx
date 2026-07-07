import type { PortalTranslations } from "../../lib/translations/portal";
import type { PosReleaseConfig } from "../../config/posConfig";
import { portalTextLink } from "../../lib/portalUi";

export function PosWebPosNote({
  release,
  p,
  isLight,
}: {
  release: PosReleaseConfig;
  p: PortalTranslations["pos"];
  isLight: boolean;
}) {
  if (release.web.enabled && release.web.url) {
    return (
      <p className="pos-web-pos-note">
        <a
          href={release.web.url}
          target="_blank"
          rel="noopener noreferrer"
          className={portalTextLink(isLight)}
        >
          {p.openWebPos}
        </a>
      </p>
    );
  }

  return <p className="pos-web-pos-note">{p.webPosPlannedNote}</p>;
}
