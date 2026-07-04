import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const posVersion = env.VITE_POS_LATEST_VERSION || "0.3.1";
  if (!env.VITE_POS_WINDOWS_URL) {
    process.env.VITE_POS_WINDOWS_URL =
      `/downloads/Caisty.PoS_${posVersion}_x64-setup.exe`;
  }
  if (!env.VITE_POS_LATEST_VERSION) {
    process.env.VITE_POS_LATEST_VERSION = posVersion;
  }

  return {
    plugins: [react()],
    server: {
      port: 5173, // Portal-App auf Port 5173 (Admin-App auf 5175)
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3333",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
