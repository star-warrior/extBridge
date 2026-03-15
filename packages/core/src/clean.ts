import fs from "node:fs/promises";
import path from "node:path";
import type { Registry } from "./registry/registry.js";
import { pathExists } from "./utils/fs.js";

export interface CleanReport {
  orphanedFolders: string[];
}

/**
 * Identifies folders in the global store that are not tracked by the registry.
 */
export async function findOrphanedExtensions(
  storeDir: string,
  registry: Registry,
): Promise<CleanReport> {
  const orphanedFolders: string[] = [];
  if (!(await pathExists(storeDir))) {
    return { orphanedFolders };
  }

  const data = registry.getAll();
  // Map registered store paths to absolute paths for reliable comparison
  const registeredPaths = new Set(
    Object.values(data.extensions).map((ext) => path.resolve(ext.storePath)),
  );

  const entries = await fs.readdir(storeDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const fullPath = path.resolve(storeDir, entry.name);
    if (!registeredPaths.has(fullPath)) {
      orphanedFolders.push(entry.name);
    }
  }

  return { orphanedFolders };
}

/**
 * Safely removes a list of folders from the store.
 */
export async function removeOrphanedExtensions(
  storeDir: string,
  folderNames: string[],
  dryRun = false,
): Promise<void> {
  for (const folderName of folderNames) {
    const fullPath = path.join(storeDir, folderName);
    if (!dryRun) {
      await fs.rm(fullPath, { recursive: true, force: true });
    }
  }
}
