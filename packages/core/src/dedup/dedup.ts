import fs from "node:fs/promises";
import path from "node:path";
import type { Registry } from "../registry/registry.js";
import { createDirectoryLink, ensureDir, pathExists } from "../utils/fs.js";
import { upsertIdeExtensionEntry } from "../utils/ide-extensions-registry.js";
import { hashDirectory } from "./hash.js";

function parseExtensionFolderName(folderName: string): { id: string; version: string } {
  const index = folderName.lastIndexOf("-");
  if (index <= 0 || index === folderName.length - 1) {
    return { id: folderName, version: "unknown" };
  }
  return {
    id: folderName.slice(0, index),
    version: folderName.slice(index + 1),
  };
}

async function uniqueStorePath(baseStorePath: string): Promise<string> {
  if (!(await pathExists(baseStorePath))) {
    return baseStorePath;
  }
  let counter = 1;
  while (true) {
    const candidate = `${baseStorePath}-${counter}`;
    if (!(await pathExists(candidate))) {
      return candidate;
    }
    counter += 1;
  }
}

import semver from "semver";

export type ConflictStrategy = "keep-both" | "latest-wins";

export interface DedupResult {
  action: "linked-existing" | "moved-new" | "skipped-conflict";
  key: string;
}

export async function deduplicateExtension(
  extensionPath: string,
  ideId: string,
  storeDir: string,
  registry: Registry,
  dryRun = false,
  strategy: ConflictStrategy = "keep-both",
): Promise<DedupResult> {
  const folderName = path.basename(extensionPath);
  const hash = await hashDirectory(extensionPath);
  const existing = registry.findByHash(hash);

  if (existing) {
    const [key, record] = existing;
    if (!record.usedBy.includes(ideId)) {
      record.usedBy.push(ideId);
      record.refCount = record.usedBy.length;
      registry.upsertExtension(key, record);
    }
    if (!dryRun) {
      await fs.rm(extensionPath, { recursive: true, force: true });
      await createDirectoryLink(record.storePath, extensionPath);
      await upsertIdeExtensionEntry(path.dirname(extensionPath), path.basename(extensionPath));
    }
    return { action: "linked-existing", key };
  }

  const parsed = parseExtensionFolderName(folderName);

  // --- Conflict Resolution ---
  if (strategy === "latest-wins") {
    const existingVersions = registry.findAllById(parsed.id);
    if (existingVersions.length > 0) {
      // Find the latest version currently in the store
      const latestInStore = existingVersions.reduce((prev, curr) => {
        return semver.gt(curr[1].version, prev[1].version) ? curr : prev;
      });

      if (semver.gt(latestInStore[1].version, parsed.version)) {
        // Current in-IDE version is older than what we have.
        // Sync the IDE to the latest one instead of adding this old one.
        if (!dryRun) {
          await fs.rm(extensionPath, { recursive: true, force: true });
          await createDirectoryLink(latestInStore[1].storePath, extensionPath);
          await upsertIdeExtensionEntry(path.dirname(extensionPath), path.basename(extensionPath));
        }

        // Update registry to show this IDE uses the latest version
        if (!latestInStore[1].usedBy.includes(ideId)) {
          latestInStore[1].usedBy.push(ideId);
          latestInStore[1].refCount = latestInStore[1].usedBy.length;
          registry.upsertExtension(latestInStore[0], latestInStore[1]);
        }

        return { action: "linked-existing", key: latestInStore[0] };
      }

      if (semver.lt(latestInStore[1].version, parsed.version)) {
        // Current in-IDE version is newer!
        // We will move it to the store (below).
        // Optionally, in a future enhancement, we could migrate all other IDEs to this new version.
      }
    }
  }
  // --- End Conflict Resolution ---

  const preferredStorePath = path.join(storeDir, folderName);
  const finalStorePath = await uniqueStorePath(preferredStorePath);
  const key = path.basename(finalStorePath);

  if (!dryRun) {
    await ensureDir(storeDir);
    await fs.rename(extensionPath, finalStorePath);
    await createDirectoryLink(finalStorePath, extensionPath);
    await upsertIdeExtensionEntry(path.dirname(extensionPath), path.basename(extensionPath));
  }

  registry.upsertExtension(key, {
    id: parsed.id,
    version: parsed.version,
    storePath: finalStorePath,
    hash,
    installedAt: new Date().toISOString(),
    usedBy: [ideId],
    refCount: 1,
  });

  return { action: "moved-new", key };
}
