import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175, // Admin-App auf Port 5175 (Portal-App auf 5173)
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3333",
        changeOrigin: true,
        // /api/health -> http://127.0.0.1:3333/health
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
