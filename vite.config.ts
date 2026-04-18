import path from "path";
import { defineConfig, loadEnv } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname);
  const port = 5173;
  return {
    build: {
      outDir: "internal/services/vite/build",
      manifest: true,
      rolldownOptions: {
        input: "resources/js/app.js",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "resources/js"),
      },
    },
    clearScreen: false,
    server: {
      port,
      origin: `http://localhost:${port}`,
      proxy: { "/api": { target: env.VITE_API_URL, changeOrigin: true } },
    },
    plugins: [solid()],
  };
});
