import type { BusinessSetupProgress as SetupState } from "../../lib/business/types";

export function BusinessSetupProgress({
  setup,
  title,
  missingLabel,
  completeMessage,
}: {
  setup: SetupState;
  title: string;
  missingLabel: string;
  completeMessage: string;
}) {
  return (
    <section className="business-setup" aria-label={title}>
      <div className="business-setup-head">
        <span className="business-setup-title">{title}</span>
        <span className="business-setup-percent">{setup.percent}%</span>
      </div>
      <div
        className="business-setup-bar"
        role="progressbar"
        aria-valuenow={setup.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div
          className="business-setup-bar-fill"
          style={{ width: `${setup.percent}%` }}
        />
      </div>
      {setup.complete ? (
        <p className="business-setup-message business-setup-message--complete">
          {completeMessage}
        </p>
      ) : setup.missingItems.length > 0 ? (
        <div className="business-setup-missing">
          <span className="business-setup-missing-label">{missingLabel}</span>
          <ul className="business-setup-missing-list">
            {setup.missingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
