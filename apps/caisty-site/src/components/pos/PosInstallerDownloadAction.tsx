import type { ReactNode } from "react";
import { isPosDesktopDownloadEnabled } from "../../config/posConfig";

type PosInstallerDownloadActionProps = {
  downloadUrl: string;
  fileName?: string;
  label: string;
  className: string;
  maintenanceMessage: string;
  children?: ReactNode;
};

export function PosInstallerDownloadAction({
  downloadUrl,
  fileName,
  label,
  className,
  maintenanceMessage,
  children,
}: PosInstallerDownloadActionProps) {
  const content = children ?? label;

  if (!isPosDesktopDownloadEnabled() || !downloadUrl) {
    return (
      <div className="pos-installer-download-unavailable space-y-2">
        <p
          role="status"
          className="dashboard-notify-row dashboard-notify-row--attention m-0 text-xs leading-relaxed"
        >
          {maintenanceMessage}
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          tabIndex={-1}
          className={`${className} pointer-events-none cursor-not-allowed opacity-50`}
        >
          {content}
        </button>
      </div>
    );
  }

  return (
    <a href={downloadUrl} download={fileName} className={className}>
      {content}
    </a>
  );
}
