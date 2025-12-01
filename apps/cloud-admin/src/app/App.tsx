// apps/cloud-admin/src/app/App.tsx
import React from "react";
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
import CustomerDetailPage from "../pages/Customers/CustomerDetailPage";

import SubscriptionsListPage from "../pages/SubscriptionsListPage";
import InvoicesListPage from "../pages/InvoicesListPage";
import InvoiceDetailPage from "../pages/Invoices/InvoiceDetailPage";
import DevicesListPage from "../pages/DevicesListPage";
import PaymentsListPage from "../pages/Payments/PaymentsListPage";
import WebhooksListPage from "../pages/Webhooks/WebhooksListPage";

import LicensesListPage from "../pages/Licenses/LicensesListPage";
import LicenseDetailPage from "../pages/Licenses/LicenseDetailPage";

import NotificationsPage from "../pages/Notifications/NotificationsPage";
import NotificationBell from "../components/NotificationBell";

import { AuthProvider, useAuth } from "../auth/AuthContext";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// Nur Layout – keine Daten-Logik
function AppShell({ children }: { children: React.ReactElement }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#e5e7eb]">
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 32px",
          borderBottom: "1px solid #1f2937",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: 600 }}>
          Caisty <span style={{ color: "#22c55e" }}>Admin</span>
        </div>

        <nav
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "14px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/">Dashboard</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/invoices">Invoices</Link>
          <Link to="/devices">Devices</Link>
          <Link to="/payments">Payments</Link>
          <Link to="/webhooks">Webhooks</Link>
          <Link to="/licenses">Licenses</Link>
          <Link to="/notifications">Notifications</Link>
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "12px",
          }}
        >
          <NotificationBell />
          {user && (
            <span style={{ color: "#9ca3af" }}>
              {user.email} ({user.role})
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #374151",
              background: "#111827",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Seiteninhalt */}
      <main
        style={{
          padding: "24px 32px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login ist frei */}
      <Route path="/login" element={<LoginPage />} />

      {/* Dashboard */}
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

      {/* Customers */}
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
        path="/customers/:customerId"
        element={
          <RequireAuth>
            <AppShell>
              <CustomerDetailPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Subscriptions */}
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

      {/* Invoices */}
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
        path="/invoices/:id"
        element={
          <RequireAuth>
            <AppShell>
              <InvoiceDetailPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Devices */}
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

      {/* Payments */}
      <Route
        path="/payments"
        element={
          <RequireAuth>
            <AppShell>
              <PaymentsListPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Webhooks */}
      <Route
        path="/webhooks"
        element={
          <RequireAuth>
            <AppShell>
              <WebhooksListPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Licenses */}
      <Route
        path="/licenses"
        element={
          <RequireAuth>
            <AppShell>
              <LicensesListPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/licenses/:id"
        element={
          <RequireAuth>
            <AppShell>
              <LicenseDetailPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Notifications */}
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <AppShell>
              <NotificationsPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Fallback */}
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
