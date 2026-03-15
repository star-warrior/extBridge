import fs from "node:fs/promises";
import path from "node:path";
import type { IDEAdapter } from "./adapters/types.js";
import { deduplicateExtension, type ConflictStrategy } from "./dedup/dedup.js";
import type { Registry } from "./registry/registry.js";
import { ensureDir } from "./utils/fs.js";

export interface InitReport {
  detectedIDEs: string[];
  scannedExtensions: number;
  linkedExisting: number;
  movedNew: number;
  failed: number;
  failures: Array<{
    ideId: string;
    extensionPath: string;
    code?: string;
    message: string;
  }>;
}

export async function initializeStore(
  adapters: IDEAdapter[],
  storeDir: string,
  registry: Registry,
  dryRun = false,
  strategy: ConflictStrategy = "keep-both",
  onProgress?: (msg: string) => void,
): Promise<InitReport> {
  const detected = adapters.filter((a) => a.isInstalled());
  let scannedExtensions = 0;
  let linkedExisting = 0;
  let movedNew = 0;
  const failures: InitReport["failures"] = [];

  if (!dryRun) {
    await ensureDir(storeDir);
  }

  for (const adapter of detected) {
    const extensionsPath = adapter.getExtensionsPath();
    registry.upsertIDE(adapter.id, {
      name: adapter.name,
      extensionsPath,
      detected: true,
    });

    const entries = await fs.readdir(extensionsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }
      scannedExtensions += 1;
      const extPath = path.join(extensionsPath, entry.name);
      onProgress?.(`[${adapter.name}] Processing ${entry.name}...`);
      try {
        const result = await deduplicateExtension(
          extPath,
          adapter.id,
          storeDir,
          registry,
          dryRun,
          strategy,
        );
        if (result.action === "linked-existing") {
          linkedExisting += 1;
        } else {
          movedNew += 1;
        }
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        failures.push({
          ideId: adapter.id,
          extensionPath: extPath,
          code: err.code,
          message: err.message,
        });
      }
    }
  }

  for (const adapter of adapters.filter((a) => !a.isInstalled())) {
    registry.upsertIDE(adapter.id, {
      name: adapter.name,
      extensionsPath: adapter.getExtensionsPath(),
      detected: false,
    });
  }

  return {
    detectedIDEs: detected.map((a) => a.id),
    scannedExtensions,
    linkedExisting,
    movedNew,
    failed: failures.length,
    failures,
  };
}
