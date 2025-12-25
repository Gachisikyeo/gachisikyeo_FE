// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/law-dong": {
        target: "https://gachisikyeo.duckdns.org",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "https://gachisikyeo.duckdns.org",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "https://gachisikyeo.duckdns.org",
        changeOrigin: true,
        secure: false,
      },
      "/files": {
        target: "https://gachisikyeo.duckdns.org",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
