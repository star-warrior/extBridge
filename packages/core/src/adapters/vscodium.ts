import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IDEAdapter } from "./types.js";

export const VSCodiumAdapter: IDEAdapter = {
  id: "vscodium",
  name: "VSCodium",
  getExtensionsPath: () => path.join(os.homedir(), ".vscode-oss", "extensions"),
  isInstalled: () => fs.existsSync(VSCodiumAdapter.getExtensionsPath()),
};
