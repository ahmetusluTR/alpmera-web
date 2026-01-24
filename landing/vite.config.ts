import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env from parent directory (root of alpmera-web)
  const env = loadEnv(mode, "../", "");
  const apiTarget = env.VITE_API_URL || "http://localhost:5000";

  return {
    plugins: [react()],
    envDir: "../", // Read .env from parent directory
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    // Enable SPA fallback for client-side routing
    appType: "spa",
  };
});
