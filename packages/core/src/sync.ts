import fs from "node:fs/promises";
import path from "node:path";
import type { Registry } from "./registry/registry.js";
import { createDirectoryLink, pathExists } from "./utils/fs.js";
import { upsertIdeExtensionEntry } from "./utils/ide-extensions-registry.js";
import { deduplicateExtension, type ConflictStrategy } from "./dedup/dedup.js";

export interface SyncReport {
  discovered: number;
  repaired: number;
  skipped: number;
  failedDiscovery: number;
}

async function discoverUntrackedExtensions(
  registry: Registry,
  storeDir: string,
  dryRun: boolean,
  strategy: ConflictStrategy = "keep-both",
  onProgress?: (msg: string) => void,
): Promise<{
  discovered: number;
  skipped: number;
  failed: number;
}> {
  const data = registry.getAll();
  let discovered = 0;
  let skipped = 0;
  let failed = 0;

  for (const [ideId, ide] of Object.entries(data.ides)) {
    if (!ide.detected || !(await pathExists(ide.extensionsPath))) {
      continue;
    }

    const entries = await fs.readdir(ide.extensionsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }

      const extensionKey = entry.name;
      const record = data.extensions[extensionKey];
      if (record?.usedBy.includes(ideId)) {
        skipped += 1;
        continue;
      }

      const extensionPath = path.join(ide.extensionsPath, extensionKey);
      onProgress?.(`[${ide.name}] Processing untracked extension ${extensionKey}...`);
      try {
        await deduplicateExtension(extensionPath, ideId, storeDir, registry, dryRun, strategy);
        discovered += 1;
      } catch {
        failed += 1;
      }
    }
  }

  return { discovered, skipped, failed };
}

export async function syncRegistryLinks(
  registry: Registry,
  storeDir: string,
  dryRun = false,
  strategy: ConflictStrategy = "keep-both",
  onProgress?: (msg: string) => void,
): Promise<SyncReport> {
  const discovery = await discoverUntrackedExtensions(
    registry,
    storeDir,
    dryRun,
    strategy,
    onProgress,
  );
  const data = registry.getAll();
  let repaired = 0;
  let skipped = discovery.skipped;

  for (const [extKey, ext] of Object.entries(data.extensions)) {
    for (const ideId of ext.usedBy) {
      const ide = data.ides[ideId];
      if (!ide || !ide.detected) {
        skipped += 1;
        continue;
      }
      const ideEntryPath = path.join(ide.extensionsPath, extKey);
      const storeExists = await pathExists(ext.storePath);
      if (!storeExists) {
        skipped += 1;
        continue;
      }

      const entryExists = await pathExists(ideEntryPath);
      if (entryExists) {
        try {
          const currentTarget = await fs.readlink(ideEntryPath);
          const resolved = path.resolve(path.dirname(ideEntryPath), currentTarget);
          if (path.resolve(ext.storePath) === resolved) {
            // Link is already correct — but still ensure extensions.json is in sync.
            if (!dryRun) {
              await upsertIdeExtensionEntry(ide.extensionsPath, extKey);
            }
            continue;
          }
          if (!dryRun) {
            await fs.rm(ideEntryPath, { recursive: true, force: true });
            await createDirectoryLink(ext.storePath, ideEntryPath);
            await upsertIdeExtensionEntry(ide.extensionsPath, extKey);
          }
          repaired += 1;
          continue;
        } catch {
          if (!dryRun) {
            await fs.rm(ideEntryPath, { recursive: true, force: true });
            await createDirectoryLink(ext.storePath, ideEntryPath);
            await upsertIdeExtensionEntry(ide.extensionsPath, extKey);
          }
          repaired += 1;
          continue;
        }
      }

      if (!dryRun) {
        await fs.mkdir(path.dirname(ideEntryPath), { recursive: true });
        await createDirectoryLink(ext.storePath, ideEntryPath);
        await upsertIdeExtensionEntry(ide.extensionsPath, extKey);
      }
      repaired += 1;
    }
  }

  return {
    discovered: discovery.discovered,
    repaired,
    skipped,
    failedDiscovery: discovery.failed,
  };
}
