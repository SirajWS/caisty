import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

type Customer = {
  id: string;
  name: string;
  email: string;
  status?: string | null;
  createdAt?: string | null;
};

type CustomersResponse = {
  items: Customer[];
  total: number;
  limit: number;
  offset: number;
};

export default function CustomersListPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGet<CustomersResponse>("/customers");
        if (cancelled) return;

        setItems(data.items ?? []);
        setTotal(data.total ?? data.items?.length ?? 0);
      } catch (err) {
        console.error("Error loading customers", err);
        if (!cancelled) {
          setError("Fehler beim Laden der Kunden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((c) => {
      const id = c.id?.toLowerCase() ?? "";
      const name = c.name?.toLowerCase() ?? "";
      const email = c.email?.toLowerCase() ?? "";

      return (
        id.includes(term) ||
        name.includes(term) ||
        email.includes(term)
      );
    });
  }, [items, search]);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Customers</h1>
      <p className="admin-page-subtitle">
        Übersicht über alle Kunden in dieser Instanz.
      </p>

      {/* Filter / Info-Leiste */}
      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          {filteredItems.length} von {total} Kunden angezeigt
        </div>

        <input
          type="text"
          placeholder="Suche nach Name, E-Mail oder ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            minWidth: 260,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #374151",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 13,
          }}
        />
      </div>

      {error && (
        <div className="admin-error-banner">
          {error}
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Status</th>
              <th>Erstellt am</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                  Lädt Kunden…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                  Keine Kunden gefunden.
                </td>
              </tr>
            ) : (
              filteredItems.map((c) => (
                <tr key={c.id}>
                  <td>{c.id.slice(0, 8)}…</td>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>
                    <span className={`status-badge status-${c.status ?? "unknown"}`}>
                      {c.status ?? "—"}
                    </span>
                  </td>
                  <td>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
