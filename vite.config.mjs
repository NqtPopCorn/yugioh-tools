import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    proxy: {
      "/ygoprodeck-api": {
        target: "https://db.ygoprodeck.com/api/v7",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ygoprodeck-api/, ""),
      },
      "/ygoprodeck-search-api": {
        target: "https://ygoprodeck.com/api/search",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ygoprodeck-search-api/, ""),
      },
      "/ygoprodeck-image": {
        target: "https://images.ygoprodeck.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ygoprodeck-image/, ""),
      },
    },
  },
  base: "/yugioh-tools/",
});
