import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const target = "https://gachisikyeo.duckdns.org";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/law-dong": { target, changeOrigin: true, secure: false },
      "/auth": { target, changeOrigin: true, secure: false },
      "/api": { target, changeOrigin: true, secure: false },
      "/files": { target, changeOrigin: true, secure: false },
      "/oauth2": { target, changeOrigin: true, secure: false },
    },
  },
});
