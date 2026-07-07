import { Link } from "react-router-dom";
import { Check, Circle } from "lucide-react";
import type { PortalTranslations } from "../../lib/translations/portal";
import type {
  PosHubDerivedState,
  PosHubReadinessItem,
  PosHubTone,
} from "../../lib/posHub/types";

function toneIconClass(tone: PosHubTone): string {
  if (tone === "ok") return "dashboard-icon--ok";
  if (tone === "attention") return "dashboard-icon--attention";
  if (tone === "action_required") return "dashboard-icon--action";
  return "dashboard-icon--muted";
}

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  tone: PosHubTone;
  href: string;
};

export function PosLaunchChecklist({
  hub,
  items,
  loading,
  p,
  dash,
}: {
  hub: PosHubDerivedState;
  items: PosHubReadinessItem[];
  loading: boolean;
  p: PortalTranslations["pos"];
  dash: string;
}) {
  const versionDone = !hub.version.updateAvailable && Boolean(hub.version.installed);
  const versionItem: ChecklistItem = {
    id: "version",
    label: p.readinessVersion,
    done: versionDone,
    tone: hub.version.updateTone,
    href: "#pos-version-updates",
  };

  const byId = Object.fromEntries(items.map((item) => [item.id, item]));
  const order = ["license", "business", "fiscal", "device", "cloud"] as const;
  const ordered: ChecklistItem[] = [
    ...order.map((id) => byId[id]).filter((item): item is PosHubReadinessItem => Boolean(item)),
    versionItem,
  ];

  return (
    <section className="dashboard-panel dashboard-panel--wide pos-checklist-panel">
      <h2 className="dashboard-panel-title">{p.launchChecklistTitle}</h2>
      <ul className="pos-checklist">
        {ordered.map((item) => (
          <li key={item.id} className="pos-checklist-item">
            {loading ? (
              <Circle size={14} className="dashboard-icon--muted" />
            ) : item.done ? (
              <Check size={14} className="dashboard-icon--ok" aria-hidden />
            ) : (
              <Circle size={14} className={toneIconClass(item.tone)} aria-hidden />
            )}
            {item.href.startsWith("#") ? (
              <a href={item.href} className="pos-checklist-link">
                {item.label}
              </a>
            ) : (
              <Link to={item.href} className="pos-checklist-link">
                {item.label}
              </Link>
            )}
            <span className="pos-checklist-status">{loading ? dash : item.done ? p.statusReady : p.statusIncomplete}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
