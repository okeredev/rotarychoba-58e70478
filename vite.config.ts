// @lovable.dev/vite-tanstack-config bundles tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, the Cloudflare plugin (build-only), componentTagger (dev-only),
// VITE_* env define injection, @ path alias, React/TanStack dedupe, error logger
// plugins, and sandbox detection. Pass overrides via the options object below.
//
// Vercel deployment: cloudflare adapter disabled and TanStack Start target switched
// to 'vercel'. Lovable's preview/sandbox still works because the Vercel preset
// produces a standard Node-compatible build that the dev server can run.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "vercel",
    server: { entry: "server" },
  },
});
