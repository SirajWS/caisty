import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import { useAuth, AuthUser } from "../auth/AuthContext";

type LoginResponse = {
  token: string;
  user: AuthUser;
};

export default function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("admin@caisty.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiPost<{ email: string; password: string }, LoginResponse>(
        "/auth/login",
        { email, password },
      );

      setAuth(res.token, res.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-50 mb-6 text-center">
          Caisty Cloud – Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">E-Mail</label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Passwort</label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium py-2 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Einloggen..." : "Einloggen"}
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Demo: <code>admin@caisty.local</code> / <code>admin123</code>
          </p>
        </form>
      </div>
    </div>
  );
}
