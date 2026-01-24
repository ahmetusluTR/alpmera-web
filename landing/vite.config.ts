import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // For production, use .env.production from landing directory
  // For development, use .env from parent directory (root of alpmera-web)
  const envDir = mode === 'production' ? '.' : '../';
  const env = loadEnv(mode, envDir, "");
  const apiTarget = env.VITE_API_URL || "http://localhost:5000";

  return {
    plugins: [react()],
    envDir, // Use current dir for production, parent for dev
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
