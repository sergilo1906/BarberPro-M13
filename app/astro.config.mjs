import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  integrations: [],
  devToolbar: { enabled: false },
  vite: { css: { devSourcemap: true } },
});
