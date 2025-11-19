// apps/cloud-admin/src/app/App.tsx
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
    Link,
    useNavigate,
  } from "react-router-dom";
  import LoginPage from "../pages/LoginPage";
  import DashboardPage from "../pages/DashboardPage";
  import CustomersListPage from "../pages/Customers/CustomersListPage";
  import SubscriptionsListPage from "../pages/SubscriptionsListPage";
  import InvoicesListPage from "../pages/InvoicesListPage";
  import DevicesListPage from "../pages/DevicesListPage";
  import { AuthProvider, useAuth } from "../auth/AuthContext";
  
  function RequireAuth({ children }: { children: JSX.Element }) {
    const { token } = useAuth();
    const location = useLocation();
  
    if (!token) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  
    return children;
  }
  
  function AppShell({ children }: { children: JSX.Element }) {
    const { user, clearAuth } = useAuth();
    const navigate = useNavigate();
  
    function handleLogout() {
      clearAuth();
      navigate("/login", { replace: true });
    }
  
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Caisty Admin</div>
  
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-emerald-400">
              Dashboard
            </Link>
            <Link to="/customers" className="hover:text-emerald-400">
              Customers
            </Link>
            <Link to="/subscriptions" className="hover:text-emerald-400">
              Subscriptions
            </Link>
            <Link to="/invoices" className="hover:text-emerald-400">
              Invoices
            </Link>
            <Link to="/devices" className="hover:text-emerald-400">
              Devices
            </Link>
          </nav>
  
          <div className="flex items-center gap-3 text-xs">
            {user && (
              <span className="text-slate-300">
                {user.email} ({user.role})
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </header>
  
        <main className="p-6">{children}</main>
      </div>
    );
  }
  
  function AppRoutes() {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
  
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </RequireAuth>
          }
        />
  
        <Route
          path="/customers"
          element={
            <RequireAuth>
              <AppShell>
                <CustomersListPage />
              </AppShell>
            </RequireAuth>
          }
        />
  
        <Route
          path="/subscriptions"
          element={
            <RequireAuth>
              <AppShell>
                <SubscriptionsListPage />
              </AppShell>
            </RequireAuth>
          }
        />
  
        <Route
          path="/invoices"
          element={
            <RequireAuth>
              <AppShell>
                <InvoicesListPage />
              </AppShell>
            </RequireAuth>
          }
        />
  
        <Route
          path="/devices"
          element={
            <RequireAuth>
              <AppShell>
                <DevicesListPage />
              </AppShell>
            </RequireAuth>
          }
        />
  
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  
  export default function App() {
    return (
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    );
  }
  