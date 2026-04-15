import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import pkg from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
  },
  // file:// で読み込む Electron のため相対パスにする
  base: "./",
  build: {
    // Electron controls the Chromium version, so we can safely target ESNext.
    target: "esnext",
  },
});
