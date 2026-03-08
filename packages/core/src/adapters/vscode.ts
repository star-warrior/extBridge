import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IDEAdapter } from "./types.js";

export const VSCodeAdapter: IDEAdapter = {
  id: "vscode",
  name: "VS Code",
  getExtensionsPath: () => path.join(os.homedir(), ".vscode", "extensions"),
  isInstalled: () => fs.existsSync(VSCodeAdapter.getExtensionsPath()),
};
