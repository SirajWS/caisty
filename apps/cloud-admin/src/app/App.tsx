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
import {
  BarChart3,
  Bell,
  Cable,
  CreditCard,
  Gauge,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Menu,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

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
import AnalyticsPage from "../pages/AnalyticsPage";
import FiscalCompliancePage from "../pages/Fiscal/FiscalCompliancePage";
import ReceiptsListPage from "../pages/Receipts/ReceiptsListPage";
import ReceiptDetailPage from "../pages/Receipts/ReceiptDetailPage";
import NotificationBell from "../components/NotificationBell";
import { CaistyLogo } from "../components/CaistyLogo.tsx";

import { AuthProvider, useAuth } from "../auth/AuthContext";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

type NavItem = { to: string; label: string; icon: React.ReactNode };

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/customers", label: "Customers", icon: <Users size={18} /> },
  { to: "/receipts", label: "POS · Receipt History", icon: <ScrollText size={18} /> },
  { to: "/fiscal", label: "Fiscal / Compliance", icon: <ShieldCheck size={18} /> },
  { to: "/licenses", label: "Licenses", icon: <KeyRound size={18} /> },
  { to: "/devices", label: "Devices", icon: <HardDrive size={18} /> },
  { to: "/subscriptions", label: "Billing · Subscriptions", icon: <CreditCard size={18} /> },
  { to: "/invoices", label: "Billing · Invoices", icon: <Receipt size={18} /> },
  { to: "/payments", label: "Billing · Payments", icon: <CreditCard size={18} /> },
  { to: "/webhooks", label: "Webhooks", icon: <Cable size={18} /> },
  { to: "/licenses/portal", label: "Portal licenses", icon: <KeyRound size={18} /> },
  { to: "/notifications", label: "Support · Notifications", icon: <Bell size={18} /> },
  { to: "/analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
];

function AppShell({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const assignTableLabels = () => {
      const tables = Array.from(
        document.querySelectorAll<HTMLTableElement>(".admin-table"),
      );
      for (const table of tables) {
        const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
          (th.textContent || "").trim(),
        );
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll("td"));
          cells.forEach((cell, i) => {
            if (!cell.getAttribute("data-label")) {
              const label = headers[i] || "Wert";
              cell.setAttribute("data-label", label);
            }
          });
        }
      }
    };

    assignTableLabels();
    const timer = window.setTimeout(assignTableLabels, 120);
    window.addEventListener("resize", assignTableLabels);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", assignTableLabels);
    };
  }, [location.pathname, children]);

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`admin-root admin-root--${theme}`}>
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          <CaistyLogo className="admin-logo-svg" />
          <div className="admin-brand-copy">
            <span className="admin-brand-main">Caisty</span>
            <span className="admin-brand-sub">Admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-nav-link ${active ? "is-active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`admin-backdrop ${mobileOpen ? "is-open" : ""}`} onClick={() => setMobileOpen(false)} />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-icon-btn mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="admin-page-meta">
              <Gauge size={16} />
              <span>{location.pathname === "/" ? "Dashboard" : location.pathname.slice(1).replace(/\//g, " / ")}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <NotificationBell />
            <button
              type="button"
              onClick={toggleTheme}
              className="admin-icon-btn"
              title={`Zu ${theme === "dark" ? "Light" : "Dark"} Mode wechseln`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <div className="admin-user-chip">
              {user?.name || user?.email}
            </div>

            <button type="button" className="admin-btn admin-btn--danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}

function ProtectedPage({ children }: { children: React.ReactElement }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
      <Route path="/customers" element={<ProtectedPage><CustomersListPage /></ProtectedPage>} />
      <Route path="/customers/:customerId" element={<ProtectedPage><CustomerDetailPage /></ProtectedPage>} />
      <Route path="/receipts" element={<ProtectedPage><ReceiptsListPage /></ProtectedPage>} />
      <Route path="/receipts/:id" element={<ProtectedPage><ReceiptDetailPage /></ProtectedPage>} />
      <Route path="/fiscal" element={<ProtectedPage><FiscalCompliancePage /></ProtectedPage>} />
      <Route path="/subscriptions" element={<ProtectedPage><SubscriptionsListPage /></ProtectedPage>} />
      <Route path="/invoices" element={<ProtectedPage><InvoicesListPage /></ProtectedPage>} />
      <Route path="/invoices/:id" element={<ProtectedPage><InvoiceDetailPage /></ProtectedPage>} />
      <Route path="/devices" element={<ProtectedPage><DevicesListPage /></ProtectedPage>} />
      <Route path="/payments" element={<ProtectedPage><PaymentsListPage /></ProtectedPage>} />
      <Route path="/webhooks" element={<ProtectedPage><WebhooksListPage /></ProtectedPage>} />
      <Route path="/licenses" element={<ProtectedPage><LicensesListPage /></ProtectedPage>} />
      <Route path="/licenses/portal" element={<ProtectedPage><PortalLicensesPage /></ProtectedPage>} />
      <Route path="/licenses/:id" element={<ProtectedPage><LicenseDetailPage /></ProtectedPage>} />
      <Route path="/notifications" element={<ProtectedPage><NotificationsPage /></ProtectedPage>} />
      <Route path="/analytics" element={<ProtectedPage><AnalyticsPage /></ProtectedPage>} />
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
