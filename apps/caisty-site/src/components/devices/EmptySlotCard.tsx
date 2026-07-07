import { Plus } from "lucide-react";
import type { PosReleaseConfig } from "../../config/posConfig";
import { openDesktopPos } from "./openDesktopPos";

export function EmptySlotCard({
  labels,
  release,
}: {
  labels: {
    title: string;
    text: string;
    add: string;
    hint: string;
  };
  release: PosReleaseConfig;
}) {
  return (
    <article className="devices-slot-empty">
      <div className="devices-slot-empty-icon" aria-hidden>
        <Plus size={22} />
      </div>
      <h3 className="devices-slot-empty-title">{labels.title}</h3>
      <p className="devices-slot-empty-text">{labels.text}</p>
      <button
        type="button"
        className="devices-slot-empty-btn"
        onClick={() => openDesktopPos(release)}
      >
        {labels.add}
      </button>
      <p className="devices-slot-empty-hint">{labels.hint}</p>
    </article>
  );
}
