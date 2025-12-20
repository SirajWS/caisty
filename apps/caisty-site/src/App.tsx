// apps/caisty-site/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import LandingPage from "./routes/LandingPage";
import LandingPageTN from "./routes/LandingPageTN";
import PricingPage from "./routes/PricingPage";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import ForgotPasswordPage from "./routes/ForgotPasswordPage";
import ResetPasswordPage from "./routes/ResetPasswordPage";
import TermsPage from "./routes/TermsPage";
import PrivacyPage from "./routes/PrivacyPage";
import ImprintPage from "./routes/ImprintPage";

import PortalLayout from "./routes/PortalLayout";
import PortalDashboard from "./routes/PortalDashboard";
import PortalLicensesPage from "./routes/PortalLicensesPage";
import PortalDevicesPage from "./routes/PortalDevicesPage";
import PortalInvoicesPage from "./routes/portal/PortalInvoicesPage";
import PortalInvoiceDetailPage from "./routes/PortalInvoiceDetailPage";
import PortalAccountPage from "./routes/PortalAccountPage";
import PortalInstallPage from "./routes/PortalInstallPage";
import PortalPlanBillingPage from "./routes/PortalPlanBillingPage";
import PortalCheckoutPage from "./routes/PortalCheckoutPage";
import PortalCheckoutSuccessPage from "./routes/PortalCheckoutSuccessPage";
import PortalCheckoutCancelPage from "./routes/PortalCheckoutCancelPage";
import PortalLoginSuccessPage from "./routes/PortalLoginSuccessPage";
import PortalSupportPage from "./routes/PortalSupportPage";
import PortalUpgradeResultPage from "./routes/PortalUpgradeResultPage";

export default function App() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isTN = host === "tn.caisty.com";

  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing-Site */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={isTN ? <LandingPageTN /> : <LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/imprint" element={<ImprintPage />} />
        </Route>

        {/* Google OAuth Success - AUSSERHALB PortalLayout (keine Auth-Prüfung) */}
        <Route path="/portal/login/success" element={<PortalLoginSuccessPage />} />

        {/* Kundenportal (geschützt) */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="licenses" element={<PortalLicensesPage />} />
          <Route path="plan" element={<PortalPlanBillingPage />} />
          <Route path="checkout" element={<PortalCheckoutPage />} />
          <Route path="checkout/success" element={<PortalCheckoutSuccessPage />} />
          <Route path="checkout/cancel" element={<PortalCheckoutCancelPage />} />
          <Route path="devices" element={<PortalDevicesPage />} />
          <Route path="invoices" element={<PortalInvoicesPage />} />
          <Route path="invoices/:id" element={<PortalInvoiceDetailPage />} />
          <Route path="support" element={<PortalSupportPage />} />
          <Route path="account" element={<PortalAccountPage />} />
          <Route path="install" element={<PortalInstallPage />} />
          <Route path="upgrade/result" element={<PortalUpgradeResultPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
