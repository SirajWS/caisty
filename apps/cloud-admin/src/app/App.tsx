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
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
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
import PortalLicensesPage from "../pages/Licenses/PortalLicensesPage";

import NotificationsPage from "../pages/Notifications/NotificationsPage";
import NotificationBell from "../components/NotificationBell";

import { AuthProvider, useAuth } from "../auth/AuthContext";
import { ThemeProvider, useTheme, themeColors } from "../theme/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();
  const colors = themeColors[theme];

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 32px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.bgSecondary,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: 600, color: colors.text }}>
          Caisty <span style={{ color: colors.accent }}>Admin</span>
        </div>

        <nav
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "14px",
            flexWrap: "wrap",
          }}
        >
          {[
            { to: "/", label: "Dashboard" },
            { to: "/customers", label: "Customers" },
            { to: "/subscriptions", label: "Subscriptions" },
            { to: "/invoices", label: "Invoices" },
            { to: "/devices", label: "Devices" },
            { to: "/payments", label: "Payments" },
            { to: "/webhooks", label: "Webhooks" },
            { to: "/licenses", label: "Licenses" },
            { to: "/licenses/portal", label: "Portal-Lizenzen" },
            { to: "/notifications", label: "Notifications" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                color: colors.textSecondary,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              {item.label}
            </Link>
          ))}
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
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Zu ${theme === "dark" ? "Light" : "Dark"} Mode wechseln`}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`,
              background: colors.bgTertiary,
              color: colors.text,
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.border;
              e.currentTarget.style.borderColor = colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.bgTertiary;
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          {user && (
            <span style={{ color: colors.textSecondary }}>
              {user.name || user.email} ({user.role})
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`,
              background: colors.bgTertiary,
              color: colors.text,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.border;
              e.currentTarget.style.borderColor = colors.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.bgTertiary;
              e.currentTarget.style.borderColor = colors.border;
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
      {/* Login & Password Reset sind frei */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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
        path="/licenses/portal"
        element={
          <RequireAuth>
            <AppShell>
              <PortalLicensesPage />
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
