import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import LandingPage from "./routes/LandingPage";
import PricingPage from "./routes/PricingPage";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import PortalLayout from "./routes/PortalLayout";
import PortalDashboard from "./routes/PortalDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          {/* Weitere Portal-Routen später */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
