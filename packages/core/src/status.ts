import fs from "node:fs/promises";
import type { Registry } from "./registry/registry.js";
import type { IDEAdapter } from "./adapters/types.js";
import { dirSize, pathExists } from "./utils/fs.js";

export interface IDEStatus {
  ideId: string;
  name: string;
  extensionsPath: string;
  detected: boolean;
  extensionCount: number;
}

export interface StatusReport {
  ides: IDEStatus[];
  sharedExtensions: number;
  totalExtensions: number;
  estimatedBytesSaved: number;
}

export async function collectStatus(
  registry: Registry,
  adapters: IDEAdapter[],
): Promise<StatusReport> {
  const data = registry.getAll();

  const ides: IDEStatus[] = [];
  for (const adapter of adapters) {
    const extPath = adapter.getExtensionsPath();
    const detected = adapter.isInstalled();
    let extensionCount = 0;

    if (detected && (await pathExists(extPath))) {
      const entries = await fs.readdir(extPath, { withFileTypes: true });
      extensionCount = entries.filter((e) => e.isDirectory() || e.isSymbolicLink()).length;
    }

    ides.push({
      ideId: adapter.id,
      name: adapter.name,
      extensionsPath: extPath,
      detected,
      extensionCount,
    });
  }

  const extensionEntries = Object.values(data.extensions);
  let estimatedBytesSaved = 0;
  for (const entry of extensionEntries) {
    if (entry.refCount <= 1) {
      continue;
    }
    if (!(await pathExists(entry.storePath))) {
      continue;
    }
    const size = await dirSize(entry.storePath);
    estimatedBytesSaved += size * (entry.refCount - 1);
  }

  const totalExtensions = extensionEntries.length;
  const sharedExtensions = extensionEntries.filter((e) => e.refCount > 1).length;

  return {
    ides,
    sharedExtensions,
    totalExtensions,
    estimatedBytesSaved,
  };
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}
