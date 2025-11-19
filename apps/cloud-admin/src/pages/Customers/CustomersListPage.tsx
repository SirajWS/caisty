import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

type Customer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

type CustomersResponse = {
  items: Customer[];
  total: number;
  limit: number;
  offset: number;
};

export default function CustomersListPage() {
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    apiGet<CustomersResponse>("/customers?limit=20&offset=0")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

 // CustomersListPage.tsx (nur Ausschnitt)

return (
    <div>
      <h1>Customers</h1>
      <p>{data ? `${data.total} Kunden gesamt` : "Lade Daten..."}</p>
  
      {data && data.items.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Status</th>
                <th>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>
                    <span
                      className={
                        c.status === "active" ? "badge badge--green" : "badge badge--red"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleString("de-DE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}  