import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loads .env, .env.local, .env.[mode], .env.[mode].local — see .env.development / .env.production
  loadEnv(mode, process.cwd(), "");

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
