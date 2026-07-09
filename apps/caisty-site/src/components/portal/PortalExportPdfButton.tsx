import { portalSecondaryCta } from "../../lib/portalUi";

export function PortalExportPdfButton({
  label,
  loadingLabel,
  disabled,
  loading,
  onClick,
  isLight,
}: {
  label: string;
  loadingLabel: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void | Promise<void>;
  isLight: boolean;
}) {
  return (
    <button
      type="button"
      className={`portal-export-pdf-btn ${portalSecondaryCta(isLight)}`}
      disabled={disabled || loading}
      onClick={() => {
        void onClick();
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
