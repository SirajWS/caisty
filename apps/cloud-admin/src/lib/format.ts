// apps/cloud-admin/src/lib/format.ts

// Datum/Zeit schön formatiert (oder "–", wenn nichts da ist)
export function formatDateTime(value: string | null | undefined): string {
    if (!value) return "–";
    return new Date(value).toLocaleString("de-DE");
  }
  
  // Optional: Geldformatierung, falls irgendwo benutzt
  export function formatMoney(cents: number, currency: string): string {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(cents / 100);
  }
  