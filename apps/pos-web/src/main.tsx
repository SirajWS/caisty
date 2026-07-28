import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { SyncDashboard } from "./pages/SyncDashboard.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SyncDashboard />} />
        <Route path="/pos" element={<SyncDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
