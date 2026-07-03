import React from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { SetupStepId, SetupStepperState } from "../lib/derivePortalSetupSteps";
import { setupStepHref } from "../lib/derivePortalSetupSteps";
import { portalPrimaryCta, portalTextLink } from "../lib/portalUi";

type StepLabels = Record<SetupStepId, string>;

type PortalSetupStepperProps = {
  state: SetupStepperState;
  stepLabels: StepLabels;
  nextStepTitle: string;
  nextStepCta: string;
  allReadyLine: string;
  isLight: boolean;
};

export function PortalSetupStepper({
  state,
  stepLabels,
  nextStepTitle,
  nextStepCta,
  allReadyLine,
  isLight,
}: PortalSetupStepperProps) {
  if (state.allDone) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          isLight
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        }`}
      >
        <Check size={16} aria-hidden />
        <span className="font-medium">{allReadyLine}</span>
      </div>
    );
  }

  const currentId = state.currentStepId;

  return (
    <div className="space-y-4">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {state.steps.map((step, index) => {
          const isCurrent = step.id === currentId;
          const isDone = step.done;
          return (
            <li
              key={step.id}
              className={`rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                isCurrent
                  ? isLight
                    ? "border-orange-400 bg-orange-50 text-orange-900"
                    : "border-orange-500/50 bg-orange-500/10 text-orange-200"
                  : isDone
                    ? isLight
                      ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
                      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : isLight
                      ? "border-slate-200 bg-slate-50 text-slate-600"
                      : "border-white/10 bg-white/[0.03] text-slate-400"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-orange-500 text-white"
                        : isLight
                          ? "bg-slate-200 text-slate-600"
                          : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isDone ? <Check size={12} aria-hidden /> : index + 1}
                </span>
                <span className="font-medium leading-snug">{stepLabels[step.id]}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {currentId ? (
        <div
          className={`rounded-xl border-2 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
            isLight
              ? "border-orange-400 bg-orange-50/50"
              : "border-orange-500/45 bg-orange-500/[0.08]"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isLight ? "text-slate-900" : "text-slate-100"
            }`}
          >
            {nextStepTitle}
          </p>
          <Link
            to={setupStepHref(currentId)}
            className={`no-underline shrink-0 ${portalPrimaryCta()} text-xs px-4 py-2`}
          >
            {nextStepCta}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function PortalCompactLink({
  to,
  children,
  isLight,
}: {
  to: string;
  children: React.ReactNode;
  isLight: boolean;
}) {
  return (
    <Link to={to} className={`no-underline text-xs ${portalTextLink(isLight)}`}>
      {children}
    </Link>
  );
}
