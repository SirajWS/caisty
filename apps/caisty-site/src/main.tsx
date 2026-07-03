import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { LanguageProvider } from "./lib/LanguageContext.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import { loadCountryConfig } from "./lib/countryConfigClient.ts";
import "./index.css";

async function bootstrap() {
  try {
    await loadCountryConfig();
  } catch (err) {
    console.warn("Country config preload failed — using legacy fallbacks until retry.", err);
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
