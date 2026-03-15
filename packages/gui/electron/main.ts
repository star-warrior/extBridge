import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Registry,
  runDoctor,
  findOrphanedExtensions,
  removeOrphanedExtensions,
  initializeStore,
  syncRegistryLinks,
  defaultAdapters,
  fetchExtensionMeta,
  installExtension,
} from "@iamjarvis/extbridge-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
// |── dist
// |   └── index.html
// |── dist-electron
// |   ├── main.js
// |   └── preload.js
//

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;

// Paths used by CLI (copied logic for consistency in early phase)
const home = app.getPath("home");
const extBridgeRoot = path.join(home, ".extbridge");
const storeDir = path.join(extBridgeRoot, "store");
const registryPath = path.join(extBridgeRoot, "registry.json");

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      // sandbox: false is required for Electron to load an ESM preload script
      // (.mjs). Without it, Electron only supports CJS preloads.
      sandbox: false,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST!, "index.html"));
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// --- IPC Bridge ---

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
  const onProgress = (msg: string) => win?.webContents.send("sync-progress", msg);
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
  const onProgress = (msg: string) => win?.webContents.send("sync-progress", msg);
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
  // installExtension(extensionId, storeDir, registry, version?, dryRun?)
  const result = await installExtension(id, storeDir, registry, version);
  if (sync) {
    await syncRegistryLinks(registry, storeDir, false, "keep-both");
  }
  await registry.save();
  return result;
});
