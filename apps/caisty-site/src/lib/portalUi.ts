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
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
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
    ? "rounded-[22px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm"
    : "rounded-[22px] border border-white/[0.08] bg-[#111827] p-5 sm:p-6 shadow-[0_4px_28px_rgba(0,0,0,0.35)]";
}

export function portalInnerCard(isLight: boolean): string {
  return isLight
    ? "rounded-2xl border border-slate-200 bg-slate-50/80"
    : "rounded-2xl border border-white/[0.06] bg-[#0f172a]/80";
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

export function portalTableShell(isLight: boolean): string {
  return isLight
    ? "rounded-[22px] border border-slate-200/90 bg-white shadow-sm overflow-x-auto"
    : "rounded-[22px] border border-white/[0.08] bg-[#111827] overflow-x-auto shadow-[0_4px_28px_rgba(0,0,0,0.35)]";
}

export function portalPrimaryCta(): string {
  return "inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55";
}

export function portalSecondaryCta(isLight: boolean): string {
  return isLight
    ? "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
    : "inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.06]";
}
