import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import r from "node:path";
import { fileURLToPath as i } from "node:url";
import {
  Registry as a,
  defaultAdapters as o,
  fetchExtensionMeta as s,
  findOrphanedExtensions as c,
  initializeStore as l,
  installExtension as u,
  removeOrphanedExtensions as d,
  runDoctor as f,
  syncRegistryLinks as p,
} from "@iamjarvis/extbridge-core";
//#region electron/main.ts
var m = r.dirname(i(import.meta.url));
((process.env.DIST = r.join(m, "../dist")),
  (process.env.VITE_PUBLIC = t.isPackaged
    ? process.env.DIST
    : r.join(process.env.DIST, "../public")));
var h,
  g = t.getPath("home"),
  _ = r.join(g, ".extbridge"),
  v = r.join(_, "store"),
  y = r.join(_, "registry.json");
function b() {
  ((h = new e({
    width: 1e3,
    height: 800,
    webPreferences: {
      preload: r.join(m, "preload.mjs"),
      sandbox: !1,
    },
  })),
    h.webContents.on("did-finish-load", () => {
      h?.webContents.send("main-process-message", /* @__PURE__ */ new Date().toLocaleString());
    }),
    process.env.VITE_DEV_SERVER_URL
      ? h.loadURL(process.env.VITE_DEV_SERVER_URL)
      : h.loadFile(r.join(process.env.DIST, "index.html")));
}
(t.on("window-all-closed", () => {
  process.platform !== "darwin" && (t.quit(), (h = null));
}),
  t.on("activate", () => {
    e.getAllWindows().length === 0 && b();
  }),
  t.whenReady().then(b),
  n.handle("get-status", async () => {
    let e = new a(y);
    return (await e.load(), e.getAll());
  }),
  n.handle("run-doctor", async () => {
    let e = new a(y);
    return (await e.load(), await f(e));
  }),
  n.handle("run-init", async (e, { dryRun: t, conflict: n }) => {
    let r = new a(y);
    await r.load();
    let i = await l(o, v, r, t, n, (e) => h?.webContents.send("sync-progress", e));
    return (t || (await r.save()), i);
  }),
  n.handle("run-sync", async (e, { dryRun: t, conflict: n }) => {
    let r = new a(y);
    await r.load();
    let i = await p(r, v, t, n, (e) => h?.webContents.send("sync-progress", e));
    return (t || (await r.save()), i);
  }),
  n.handle("find-orphans", async () => {
    let e = new a(y);
    return (await e.load(), await c(v, e));
  }),
  n.handle("remove-orphans", async (e, { folders: t }) => (await d(v, t), { success: !0 })),
  n.handle("get-extension-meta", async (e, { id: t }) => await s(t)),
  n.handle("install-extension", async (e, { id: t, version: n, sync: r }) => {
    let i = new a(y);
    await i.load();
    let o = await u(t, v, i, n);
    return (r && (await p(i, v, !1, "keep-both")), await i.save(), o);
  }));
//#endregion
