import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IDEAdapter } from "./types.js";

export const AntigravityAdapter: IDEAdapter = {
  id: "antigravity",
  name: "Antigravity",
  getExtensionsPath: () => path.join(os.homedir(), ".antigravity", "extensions"),
  isInstalled: () => fs.existsSync(AntigravityAdapter.getExtensionsPath()),
};
