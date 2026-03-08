import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IDEAdapter } from "./types.js";

export const CursorAdapter: IDEAdapter = {
  id: "cursor",
  name: "Cursor",
  getExtensionsPath: () => path.join(os.homedir(), ".cursor", "extensions"),
  isInstalled: () => fs.existsSync(CursorAdapter.getExtensionsPath()),
};
