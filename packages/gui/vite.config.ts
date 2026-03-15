import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import react from "@vitejs/plugin-react";

// Node.js built-in module names (hardcoded to avoid needing @types/node).
const NODE_BUILTINS = [
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
];

const nodeExternals = [
  "electron",
  ...NODE_BUILTINS,
  ...NODE_BUILTINS.map((m) => `node:${m}`),
  // Keep core external so its CJS deps (unzipper, chokidar) don't get inlined
  "@iamjarvis/extbridge-core",
];

// https://vitejs.dev/config/
export default defineConfig({
  legacy: {
    inconsistentCjsInterop: true,
  },
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: nodeExternals,
            },
          },
        },
      },
      {
        // Preload script.
        //
        // NOTE: vite-plugin-electron detects "type":"module" in package.json and
        // forces ESM output (lib.formats = ['es']).  So the preload is always
        // output as ESM regardless of any rollupOptions.output.format we set.
        //
        // Electron 28+ natively supports ESM preload scripts when:
        //   1. The file has an .mjs extension   ← we rename it here
        //   2. sandbox: false in webPreferences  ← set in main.ts
        //
        // entryFileNames renames the output to preload.mjs so Electron loads
        // it as an ES module — contextBridge works normally in ESM preloads.
        entry: "electron/preload.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: nodeExternals,
              output: {
                entryFileNames: "[name].mjs",
              },
            },
          },
        },
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
});
