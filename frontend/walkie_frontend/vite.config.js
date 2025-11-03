import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true,
    // ✅ AJUSTE CORRIGIDO: Adicionando o host do Ngrok explicitamente
    allowedHosts: ["kristen-unsiding-norene.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://192.168.15.102:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/static": {
        target: "http://192.168.15.102:8000",
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
