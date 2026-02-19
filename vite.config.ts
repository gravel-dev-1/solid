import path from "path";
import { defineConfig, loadEnv } from "vite";
import solid from "vite-plugin-solid";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname);

  return {
    build: { outDir: "internal/vite/build" },
    clearScreen: false,
    resolve: {
      alias: {
        "@": path.resolve("src"),
      },
    },
    server: {
      port: 5173,
      origin: "http://localhost:5173",
      proxy: { "/api": { target: env.VITE_API_URL, changeOrigin: true } },
    },
    plugins: [
      tanstackRouter({
        target: "solid",
        autoCodeSplitting: true,
      }),
      solid(),
    ],
  };
});
