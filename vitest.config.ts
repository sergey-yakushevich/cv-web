import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  /*
   * tsconfig.json says jsx: "preserve" for Next's compiler; Vite's oxc
   * transform inherits that and then chokes on the untouched JSX when a test
   * imports a .tsx data file. Compile it for real here.
   */
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      /*
       * "server-only" throws when imported outside a React Server Component
       * bundle. The db and user modules import it as a guard rail; in tests
       * we are deliberately on the server side, so it maps to a no-op.
       */
      "server-only": resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
