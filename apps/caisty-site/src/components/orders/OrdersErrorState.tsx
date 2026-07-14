import { portalSecondaryCta } from "../../lib/portalUi";

export function OrdersErrorState({
  headline,
  description,
  retryLabel,
  onRetry,
  isLight,
  loading = false,
}: {
  headline: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
  isLight: boolean;
  loading?: boolean;
}) {
  return (
    <section className="orders-error-state dashboard-panel dashboard-panel--wide">
      <h2 className="orders-error-state-title">{headline}</h2>
      <p className="orders-error-state-description">{description}</p>
      <button
        type="button"
        className={portalSecondaryCta(isLight)}
        disabled={loading}
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    </section>
  );
}
