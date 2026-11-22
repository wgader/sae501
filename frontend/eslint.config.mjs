import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      tailwindcss,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: "./src/app/globals.css",
      },
    },
    rules: {
      "tailwindcss/no-arbitrary-value": "warn",
    },
  },
  {
    // Dans l'application, les messages passent par src/lib/logger.ts, qui filtre par niveau.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
