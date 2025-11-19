// apps-cloud-admin/src/pages/InvoicesListPage.tsx
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { formatDateTime, formatMoney } from "../lib/format";

type Invoice = {
  id: string;
  number: string;
  status: string;
  amountCents: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
};

type InvoicesResponse = {
  items: Invoice[];
  total: number;
  limit: number;
  offset: number;
};

export default function InvoicesListPage() {
  const [data, setData] = useState<InvoicesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGet<InvoicesResponse>("/invoices?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Invoices</h1>
          <p className="text-slate-400 mt-1">
            {data ? `${data.total} Rechnungen` : "Lade Daten…"}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-b-2 border-emerald-400 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-4">
          <p className="text-red-300 text-sm">
            Fehler beim Laden der Rechnungen: {error}
          </p>
        </div>
      )}

      {data && data.items.length === 0 && !loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <p className="text-slate-400">Keine Rechnungen gefunden.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/60 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Nummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Ausgestellt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Fällig am
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.items.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-50">
                      {inv.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inv.status === "paid"
                            ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800"
                            : inv.status === "open"
                            ? "bg-amber-900/30 text-amber-400 border border-amber-800"
                            : "bg-slate-800/60 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {formatMoney(inv.amountCents, inv.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {formatDateTime(inv.issuedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {formatDateTime(inv.dueAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
