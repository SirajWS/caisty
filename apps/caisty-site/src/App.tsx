// apps/caisty-site/src/App.tsx
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import { COMPANY_HOME, LEGAL_PATHS, POS_LANDING_PATH } from "./config/marketingRoutes";
import PortalLayout from "./routes/PortalLayout";

const CompanyPage = lazy(() => import("./routes/CompanyPage"));
const LandingPage = lazy(() => import("./routes/LandingPage"));
const PricingPage = lazy(() => import("./routes/PricingPage"));
const LoginPage = lazy(() => import("./routes/LoginPage"));
const RegisterPage = lazy(() => import("./routes/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./routes/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./routes/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./routes/VerifyEmailPage"));
const TermsPage = lazy(() => import("./routes/TermsPage"));
const PrivacyPage = lazy(() => import("./routes/PrivacyPage"));
const ImprintPage = lazy(() => import("./routes/ImprintPage"));
const ContactPage = lazy(() => import("./routes/ContactPage"));
const CookiePolicyPage = lazy(() => import("./routes/CookiePolicyPage"));
const EulaPage = lazy(() => import("./routes/EulaPage"));
const DpaPage = lazy(() => import("./routes/DpaPage"));
const SubprocessorsPage = lazy(() => import("./routes/SubprocessorsPage"));
const WorkTrackPage = lazy(() => import("./routes/WorkTrackPage"));

const PortalDashboard = lazy(() => import("./routes/PortalDashboard"));
const PortalLicensesPage = lazy(() => import("./routes/PortalLicensesPage"));
const PortalDevicesPage = lazy(() => import("./routes/PortalDevicesPage"));
const PortalInvoicesPage = lazy(() => import("./routes/PortalInvoicesPage"));
const PortalInvoiceDetailPage = lazy(() => import("./routes/PortalInvoiceDetailPage"));
const PortalAccountPage = lazy(() => import("./routes/PortalAccountPage"));
const PortalInstallPage = lazy(() => import("./routes/PortalInstallPage"));
const PortalPlanBillingPage = lazy(() => import("./routes/PortalPlanBillingPage"));
const PortalCheckoutPage = lazy(() => import("./routes/PortalCheckoutPage"));
const PortalCheckoutSuccessPage = lazy(() => import("./routes/PortalCheckoutSuccessPage"));
const PortalCheckoutCancelPage = lazy(() => import("./routes/PortalCheckoutCancelPage"));
const PortalLoginSuccessPage = lazy(() => import("./routes/PortalLoginSuccessPage"));
const PortalSupportPage = lazy(() => import("./routes/PortalSupportPage"));
const PortalUpgradeResultPage = lazy(() => import("./routes/PortalUpgradeResultPage"));
const PortalBusinessPage = lazy(() => import("./routes/PortalBusinessPage"));
const PortalPosPage = lazy(() => import("./routes/PortalPosPage"));
const PortalOrdersPage = lazy(() => import("./routes/PortalOrdersPage"));
const PortalReportsPage = lazy(() => import("./routes/PortalReportsPage"));

function RouteFallback() {
  return (
    <div className="marketing-site mkt-shell mkt-section" style={{ background: "var(--mkt-bg)" }} aria-busy="true" aria-live="polite" />
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Lazy><CompanyPage /></Lazy>} />
          <Route path="/company" element={<Navigate to={COMPANY_HOME} replace />} />
          <Route path="/caisty-pos" element={<Lazy><LandingPage /></Lazy>} />
          <Route path="/product" element={<Navigate to={POS_LANDING_PATH} replace />} />
          <Route path="/pricing" element={<Lazy><PricingPage /></Lazy>} />
          <Route path="/worktrack" element={<Lazy><WorkTrackPage /></Lazy>} />
          <Route path="/shiftiq" element={<Navigate to="/worktrack" replace />} />
          <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
          <Route path="/register" element={<Lazy><RegisterPage /></Lazy>} />
          <Route path="/forgot-password" element={<Lazy><ForgotPasswordPage /></Lazy>} />
          <Route path="/reset-password" element={<Lazy><ResetPasswordPage /></Lazy>} />
          <Route path="/verify-email" element={<Lazy><VerifyEmailPage /></Lazy>} />
          <Route path="/terms" element={<Navigate to={LEGAL_PATHS.terms} replace />} />
          <Route path="/privacy" element={<Navigate to={LEGAL_PATHS.privacy} replace />} />
          <Route path={LEGAL_PATHS.terms} element={<Lazy><TermsPage /></Lazy>} />
          <Route path={LEGAL_PATHS.privacy} element={<Lazy><PrivacyPage /></Lazy>} />
          <Route path={LEGAL_PATHS.cookie} element={<Lazy><CookiePolicyPage /></Lazy>} />
          <Route path={LEGAL_PATHS.eula} element={<Lazy><EulaPage /></Lazy>} />
          <Route path={LEGAL_PATHS.dpa} element={<Lazy><DpaPage /></Lazy>} />
          <Route path={LEGAL_PATHS.subprocessors} element={<Lazy><SubprocessorsPage /></Lazy>} />
          <Route path="/imprint" element={<Lazy><ImprintPage /></Lazy>} />
          <Route path="/contact" element={<Lazy><ContactPage /></Lazy>} />
        </Route>

        <Route path="/portal/login/success" element={<Lazy><PortalLoginSuccessPage /></Lazy>} />

        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Lazy><PortalDashboard /></Lazy>} />
          <Route path="licenses" element={<Lazy><PortalLicensesPage /></Lazy>} />
          <Route path="billing" element={<Lazy><PortalPlanBillingPage /></Lazy>} />
          <Route path="plan" element={<Navigate to="/portal/billing" replace />} />
          <Route path="checkout" element={<Lazy><PortalCheckoutPage /></Lazy>} />
          <Route path="checkout/success" element={<Lazy><PortalCheckoutSuccessPage /></Lazy>} />
          <Route path="checkout/cancel" element={<Lazy><PortalCheckoutCancelPage /></Lazy>} />
          <Route path="devices" element={<Lazy><PortalDevicesPage /></Lazy>} />
          <Route path="invoices" element={<Lazy><PortalInvoicesPage /></Lazy>} />
          <Route path="invoices/:id" element={<Lazy><PortalInvoiceDetailPage /></Lazy>} />
          <Route path="business" element={<Lazy><PortalBusinessPage /></Lazy>} />
          <Route path="support" element={<Lazy><PortalSupportPage /></Lazy>} />
          <Route path="pos" element={<Lazy><PortalPosPage /></Lazy>} />
          <Route path="orders" element={<Lazy><PortalOrdersPage /></Lazy>} />
          <Route path="reports" element={<Lazy><PortalReportsPage /></Lazy>} />
          <Route path="account" element={<Lazy><PortalAccountPage /></Lazy>} />
          <Route path="install" element={<Lazy><PortalInstallPage /></Lazy>} />
          <Route path="upgrade/result" element={<Lazy><PortalUpgradeResultPage /></Lazy>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
