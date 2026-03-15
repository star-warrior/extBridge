import { BrowserWindow, app, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Registry,
  defaultAdapters,
  fetchExtensionMeta,
  findOrphanedExtensions,
  initializeStore,
  installExtension,
  removeOrphanedExtensions,
  runDoctor,
  syncRegistryLinks,
} from "@iamjarvis/extbridge-core";
//#region electron/main.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");
var win;
var home = app.getPath("home");
var extBridgeRoot = path.join(home, ".extbridge");
var storeDir = path.join(extBridgeRoot, "store");
var registryPath = path.join(extBridgeRoot, "registry.json");
function createWindow() {
  win = new BrowserWindow({
    width: 1e3,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      sandbox: false,
    },
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", /* @__PURE__ */ new Date().toLocaleString());
  });
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(process.env.DIST, "index.html"));
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(createWindow);
ipcMain.handle("get-status", async () => {
  const registry = new Registry(registryPath);
  await registry.load();
  return registry.getAll();
});
ipcMain.handle("run-doctor", async () => {
  const registry = new Registry(registryPath);
  await registry.load();
  return await runDoctor(registry);
});
ipcMain.handle("run-init", async (event, { dryRun, conflict }) => {
  const registry = new Registry(registryPath);
  await registry.load();
  const onProgress = (msg) => win?.webContents.send("sync-progress", msg);
  const report = await initializeStore(
    defaultAdapters,
    storeDir,
    registry,
    dryRun,
    conflict,
    onProgress,
  );
  if (!dryRun) await registry.save();
  return report;
});
ipcMain.handle("run-sync", async (event, { dryRun, conflict }) => {
  const registry = new Registry(registryPath);
  await registry.load();
  const onProgress = (msg) => win?.webContents.send("sync-progress", msg);
  const report = await syncRegistryLinks(registry, storeDir, dryRun, conflict, onProgress);
  if (!dryRun) await registry.save();
  return report;
});
ipcMain.handle("find-orphans", async () => {
  const registry = new Registry(registryPath);
  await registry.load();
  return await findOrphanedExtensions(storeDir, registry);
});
ipcMain.handle("remove-orphans", async (event, { folders }) => {
  await removeOrphanedExtensions(storeDir, folders);
  return { success: true };
});
ipcMain.handle("get-extension-meta", async (event, { id }) => {
  return await fetchExtensionMeta(id);
});
ipcMain.handle("install-extension", async (event, { id, version, sync }) => {
  const registry = new Registry(registryPath);
  await registry.load();
  const result = await installExtension(id, storeDir, registry, version);
  if (sync) await syncRegistryLinks(registry, storeDir, false, "keep-both");
  await registry.save();
  return result;
});
//#endregion
