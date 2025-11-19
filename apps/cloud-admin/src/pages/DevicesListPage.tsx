import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { formatDateTime } from "../lib/format";

type Device = {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
};

type DevicesResponse = {
  items: Device[];
  total: number;
  limit: number;
  offset: number;
};

export default function DevicesListPage() {
  const [data, setData] = useState<DevicesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<DevicesResponse>("/devices?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Konnte Devices nicht laden.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Devices</h1>
      <p className="admin-page-subtitle">
        {data ? `${data.total} Devices gesamt` : "Lade Daten…"}
      </p>

      {loading && <p>Lade…</p>}
      {error && <div className="admin-error">{error}</div>}

      {data && data.items.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Letztes Signal</th>
                <th>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.type}</td>
                  <td>
                    <span
                      className={
                        d.status === "active"
                          ? "badge badge--green"
                          : "badge badge--red"
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.lastSeenAt ? formatDateTime(d.lastSeenAt) : "noch nie"}
                  </td>
                  <td>{formatDateTime(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && !loading && !error && data.items.length === 0 && (
        <p>Keine Devices vorhanden.</p>
      )}
    </div>
  );
}
