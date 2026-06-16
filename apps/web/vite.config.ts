import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const ZERO_PATH_REGEX = /^\/zero/;

export default defineConfig(({ mode }) => {
  const envDir = "../..";
  const env = { ...loadEnv(mode, envDir, ""), ...process.env };

  return {
    envDir,
    server: {
      port: Number(env.VITE_PORT ?? 2001),
      proxy: {
        ...(env.CHURCH_TASK_E2E_API_URL
          ? {
              "/api": {
                changeOrigin: true,
                target: env.CHURCH_TASK_E2E_API_URL,
              },
            }
          : {}),
        ...(env.VITE_ZERO_CACHE_URL
          ? {
              "/zero": {
                changeOrigin: true,
                rewrite: (path: string) => path.replace(ZERO_PATH_REGEX, ""),
                target: env.VITE_ZERO_CACHE_URL,
                ws: true,
              },
            }
          : {}),
      },
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tailwindcss(),
      tanstackRouter({
        target: "react",
        // Deliberately not code-split: one bundle means a navigation can never
        // await a JS chunk, so route pending states are unrepresentable
        // (docs/adr/0010-no-render-gates.md).
        autoCodeSplitting: false,
      }),
      react(),
    ],
  };
});
