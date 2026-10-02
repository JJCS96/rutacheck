import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, las peticiones a /api/* se reenvian al servidor PHP.
// Arrancarlo desde la raiz del proyecto con:  php -S localhost:8000
const PHP_API_TARGET = process.env.PHP_API_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el build se puede servir desde cualquier subcarpeta
  base: "./",
  server: {
    proxy: {
      "/api": { target: PHP_API_TARGET, changeOrigin: true },
    },
  },
  build: {
    // Se publica en <proyecto>/app/, al lado de api/
    outDir: "../app",
    emptyOutDir: true,
  },
});
