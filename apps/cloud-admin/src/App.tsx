// apps/cloud-admin/src/App.tsx
import type React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersListPage from "./pages/Customers/CustomersListPage";
import SubscriptionsListPage from "./pages/SubscriptionsListPage";
import InvoicesListPage from "./pages/InvoicesListPage";
import DevicesListPage from "./pages/DevicesListPage";

const layoutStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  background: "#020617",
  color: "#e5e7eb",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  borderBottom: "1px solid #1f2937",
  padding: "12px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#0f172a",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  fontSize: 14,
};

const navLinkStyle: React.CSSProperties = {
  color: "#e5e7eb",
  textDecoration: "none",
  padding: "4px 8px",
  borderRadius: 4,
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  maxWidth: "100%",
  overflowX: "auto",
};

export default function App() {
  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>Caisty Admin</div>
        <nav style={navStyle}>
          <Link to="/login" style={navLinkStyle}>
            Login
          </Link>
          <Link to="/dashboard" style={navLinkStyle}>
            Dashboard
          </Link>
          <Link to="/customers" style={navLinkStyle}>
            Customers
          </Link>
          <Link to="/subscriptions" style={navLinkStyle}>
            Subscriptions
          </Link>
          <Link to="/invoices" style={navLinkStyle}>
            Invoices
          </Link>
          <Link to="/devices" style={navLinkStyle}>
            Devices
          </Link>
        </nav>
      </header>
      <main style={mainStyle}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersListPage />} />
          <Route path="/subscriptions" element={<SubscriptionsListPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/devices" element={<DevicesListPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
