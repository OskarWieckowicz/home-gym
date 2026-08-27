import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}"],
    plugins: {
      sonarjs,
    },
    rules: {
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["warn", 20],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],
      "sonarjs/cognitive-complexity": ["warn", 15],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "reports/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
