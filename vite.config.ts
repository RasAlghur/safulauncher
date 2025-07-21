import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  build: {
    target: "es2022", // Or 'esnext'
    assetsInlineLimit: 4096, // Increase asset caching
  },
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      algorithm: "brotliCompress", // or 'gzip'
      ext: ".br",
      deleteOriginFile: false,
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
    hmr: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
