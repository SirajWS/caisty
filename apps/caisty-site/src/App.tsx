// apps/caisty-site/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import LandingPage from "./routes/LandingPage";
import PricingPage from "./routes/PricingPage";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import PortalLayout from "./routes/PortalLayout";
import PortalDashboard from "./routes/PortalDashboard";
import PortalLicensesPage from "./routes/PortalLicensesPage";
import PortalDevicesPage from "./routes/PortalDevicesPage";
import PortalInvoicesPage from "./routes/PortalInvoicesPage";
import PortalAccountPage from "./routes/PortalAccountPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing-Site */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Kundenportal */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="licenses" element={<PortalLicensesPage />} />
          <Route path="devices" element={<PortalDevicesPage />} />
          <Route path="invoices" element={<PortalInvoicesPage />} />
          <Route path="account" element={<PortalAccountPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

