import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IDEAdapter } from "./types.js";

export const WindsurfAdapter: IDEAdapter = {
  id: "windsurf",
  name: "Windsurf",
  getExtensionsPath: () => path.join(os.homedir(), ".windsurf", "extensions"),
  isInstalled: () => fs.existsSync(WindsurfAdapter.getExtensionsPath()),
};
