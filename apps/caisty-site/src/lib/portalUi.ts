/** Shared portal visual tokens (no logic). Matches public site navy / orange. */

export function portalTextLink(isLight: boolean): string {
  return isLight
    ? "text-orange-600 hover:text-orange-700 font-medium"
    : "text-orange-400 hover:text-orange-300 font-medium";
}

export function portalMutedLink(isLight: boolean): string {
  return isLight
    ? "text-slate-500 hover:text-slate-800"
    : "text-slate-400 hover:text-slate-100";
}

/** License / generic status: success stays green; expired warning; rest neutral. */
export function portalLicenseStatusBadge(
  status: string,
  isLight: boolean,
): string {
  const s = status.toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize";
  if (s === "active") {
    return `${base} ${
      isLight
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
    }`;
  }
  if (s === "expired") {
    return `${base} ${
      isLight
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-amber-500/40 bg-amber-500/15 text-amber-200"
    }`;
  }
  if (s === "revoked") {
    return `${base} ${
      isLight
        ? "border-rose-300 bg-rose-50 text-rose-800"
        : "border-rose-500/40 bg-rose-500/10 text-rose-300"
    }`;
  }
  return `${base} ${
    isLight
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-white/10 bg-slate-800/80 text-slate-300"
  }`;
}

/** Receipt business lifecycle status badge (Sprint 5.2C). */
export function portalReceiptStatusBadge(
  status: string,
  isLight: boolean,
): string {
  const s = status.toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
  if (s === "active") {
    return `${base} ${
      isLight
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
    }`;
  }
  if (s === "refunded" || s === "partial_refund") {
    return `${base} ${
      isLight
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-amber-500/40 bg-amber-500/15 text-amber-200"
    }`;
  }
  if (s === "voided") {
    return `${base} ${
      isLight
        ? "border-rose-300 bg-rose-50 text-rose-800"
        : "border-rose-500/40 bg-rose-500/10 text-rose-300"
    }`;
  }
  return `${base} ${
    isLight
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-white/10 bg-slate-800/80 text-slate-300"
  }`;
}

/** Invoice row status */
export function portalInvoiceStatusBadge(
  status: string,
  isLight: boolean,
): string {
  const s = status.toLowerCase();
  const base = "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize";
  if (s === "paid") {
    return `${base} ${
      isLight
        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    }`;
  }
  if (s === "open" || s === "pending") {
    return `${base} ${
      isLight
        ? "border border-amber-200 bg-amber-50 text-amber-900"
        : "border border-amber-500/30 bg-amber-500/10 text-amber-200"
    }`;
  }
  if (s === "canceled" || s === "cancelled") {
    return `${base} ${
      isLight
        ? "border border-red-200 bg-red-50 text-red-800"
        : "border border-red-500/30 bg-red-500/10 text-red-300"
    }`;
  }
  return `${base} ${
    isLight
      ? "border border-slate-200 bg-slate-100 text-slate-700"
      : "border border-white/10 bg-slate-800/80 text-slate-300"
  }`;
}

export function portalCardShell(isLight: boolean): string {
  return isLight
    ? "rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    : "rounded-xl border border-white/10 bg-white/[0.04] p-4";
}

export function portalCompactCard(isLight: boolean): string {
  return isLight
    ? "rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
    : "rounded-lg border border-white/10 bg-white/[0.04] p-3";
}

export function portalPageShell(): string {
  return "portal-page space-y-4";
}

export function portalPageTitle(isLight: boolean): string {
  return `text-[22px] font-semibold tracking-tight ${
    isLight ? "text-[#0B1220]" : "text-white"
  }`;
}

export function portalPageSubtitle(isLight: boolean): string {
  return `text-sm leading-snug ${isLight ? "text-slate-600" : "text-slate-400"}`;
}

export function portalInnerCard(isLight: boolean): string {
  return isLight
    ? "rounded-xl border border-gray-200 bg-slate-50/90"
    : "rounded-xl border border-white/10 bg-white/[0.03]";
}

export function portalConnectionBadge(status: string, isLight: boolean): string {
  const s = status.toLowerCase();
  const base = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize";
  if (s === "online" || s === "active") {
    return `${base} ${
      isLight ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
    }`;
  }
  return `${base} ${
    isLight ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-slate-800 text-slate-400 border border-white/10"
  }`;
}

export function portalTableShell(isLight?: boolean): string {
  void isLight;
  return "portal-table-wrapper overflow-x-auto";
}

export function portalPrimaryCta(): string {
  return "inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55";
}

export function portalSecondaryCta(isLight: boolean): string {
  return isLight
    ? "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
    : "inline-flex items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.06]";
}

/** Small uppercase section / card eyebrow */
export function portalSectionLabel(isLight: boolean): string {
  return isLight
    ? "text-[11px] font-semibold uppercase tracking-widest text-slate-500"
    : "text-[11px] font-semibold uppercase tracking-widest text-slate-400";
}

/** Native inputs / textareas in portal forms */
export function portalInputClass(isLight: boolean): string {
  return [
    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-[box-shadow,border-color]",
    "focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40",
    isLight
      ? "border-gray-200 bg-white text-slate-900 placeholder:text-slate-400"
      : "border-white/10 bg-white/[0.05] text-slate-100 placeholder:text-slate-500",
  ].join(" ");
}

/** Cloud status tone (POS Admin Architecture v1.0). */
export function portalCloudStatusTone(
  tone: "ok" | "attention" | "action_required" | "unknown",
  isLight: boolean,
): string {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  switch (tone) {
    case "ok":
      return `${base} ${
        isLight
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
      }`;
    case "attention":
      return `${base} ${
        isLight
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-amber-500/40 bg-amber-500/15 text-amber-200"
      }`;
    case "action_required":
      return `${base} ${
        isLight
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : "border-rose-500/40 bg-rose-500/10 text-rose-300"
      }`;
    default:
      return `${base} ${
        isLight
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-white/10 bg-slate-800/80 text-slate-400"
      }`;
  }
}
