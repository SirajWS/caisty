import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const PortalInvoicesPage: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/portal/billing${location.hash || "#billing-invoices"}`} replace />;
};

export default PortalInvoicesPage;
