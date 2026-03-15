/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect, _electron as electron, ElectronApplication, Page } from "@playwright/test";
import path from "path";

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // Launch the electron app with main.js from dist-electron
  electronApp = await electron.launch({
    args: [path.join(process.cwd(), "dist-electron/main.js")],
  });
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test("App should launch with correct title", async () => {
  const title = await window.title();
  expect(title).toBe("ExtBridge Dashboard");
});

test("App window has valid dimensions", async () => {
  const windowState = await electronApp.evaluate(async ({ BrowserWindow }: any) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    return mainWindow.getBounds();
  });
  // Check that the width and height are numerical bounds
  expect(typeof windowState.width).toBe("number");
  expect(typeof windowState.height).toBe("number");
  expect(windowState.width).toBeGreaterThan(0);
  expect(windowState.height).toBeGreaterThan(0);
});

test("React app is mounted on #root", async () => {
  const rootElement = window.locator("#root");
  await expect(rootElement).toBeAttached();
});
