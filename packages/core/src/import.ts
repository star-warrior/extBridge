import fs from "node:fs/promises";
import path from "node:path";
import type { Registry } from "./registry/registry.js";
import { createDirectoryLink, pathExists } from "./utils/fs.js";
import { upsertIdeExtensionEntry } from "./utils/ide-extensions-registry.js";

export interface ImportToIdeReport {
  ideId: string;
  linked: number;
  alreadyLinked: number;
  skipped: number;
  failed: number;
  failures: Array<{
    extensionKey: string;
    code?: string;
    message: string;
  }>;
}

export async function importStoreToIde(
  registry: Registry,
  ideId: string,
  dryRun = false,
): Promise<ImportToIdeReport> {
  const data = registry.getAll();
  const ide = data.ides[ideId];
  if (!ide) {
    throw new Error(`IDE '${ideId}' is not registered. Use add-ide first.`);
  }

  let linked = 0;
  let alreadyLinked = 0;
  let skipped = 0;
  const failures: ImportToIdeReport["failures"] = [];

  for (const [extKey, ext] of Object.entries(data.extensions)) {
    const storeExists = await pathExists(ext.storePath);
    if (!storeExists) {
      skipped += 1;
      continue;
    }

    const ideEntryPath = path.join(ide.extensionsPath, extKey);
    try {
      const entryExists = await pathExists(ideEntryPath);
      if (entryExists) {
        try {
          const currentTarget = await fs.readlink(ideEntryPath);
          const resolved = path.resolve(path.dirname(ideEntryPath), currentTarget);
          if (path.resolve(ext.storePath) === resolved) {
            alreadyLinked += 1;
            if (!ext.usedBy.includes(ideId)) {
              ext.usedBy.push(ideId);
              ext.refCount = ext.usedBy.length;
              registry.upsertExtension(extKey, ext);
            }
            if (!dryRun) {
              await upsertIdeExtensionEntry(ide.extensionsPath, extKey);
            }
            continue;
          }
        } catch {
          // Non-link or unreadable link at target path; replace it.
        }

        if (!dryRun) {
          await fs.rm(ideEntryPath, { recursive: true, force: true });
        }
      }

      if (!dryRun) {
        await fs.mkdir(path.dirname(ideEntryPath), { recursive: true });
        await createDirectoryLink(ext.storePath, ideEntryPath);
        await upsertIdeExtensionEntry(ide.extensionsPath, extKey);
      }
      linked += 1;

      if (!ext.usedBy.includes(ideId)) {
        ext.usedBy.push(ideId);
        ext.refCount = ext.usedBy.length;
        registry.upsertExtension(extKey, ext);
      }
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      failures.push({
        extensionKey: extKey,
        code: err.code,
        message: err.message,
      });
    }
  }

  return {
    ideId,
    linked,
    alreadyLinked,
    skipped,
    failed: failures.length,
    failures,
  };
}
