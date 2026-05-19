import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/imgbb-api": {
        target: "https://api.imgbb.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/imgbb-api/, ""),
        secure: true,
      },
    },
  },
});
