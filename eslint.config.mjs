import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Browser APIs live in src/services; UI, hooks and pages go through the service layer.
  {
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}", "src/app/**/page.tsx", "src/app/layout.tsx"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["fetch", "window", "document", "navigator", "localStorage", "sessionStorage", "alert", "confirm", "prompt", "ResizeObserver", "IntersectionObserver", "XMLHttpRequest", "location", "history"].map((name) => ({
          name,
          message: "Call browser APIs through a module in src/services.",
        })),
      ],
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
