import type { IDEAdapter } from "./types.js";
import { AntigravityAdapter } from "./antigravity.js";
import { CursorAdapter } from "./cursor.js";
import { VSCodeAdapter } from "./vscode.js";
import { VSCodiumAdapter } from "./vscodium.js";
import { WindsurfAdapter } from "./windsurf.js";

export const defaultAdapters: IDEAdapter[] = [
  VSCodeAdapter,
  AntigravityAdapter,
  CursorAdapter,
  WindsurfAdapter,
  VSCodiumAdapter,
];

export type { IDEAdapter };
