import fs from "node:fs/promises";
import path from "node:path";
import type { Registry } from "./registry/registry.js";
import { isSymlinkTo, pathExists } from "./utils/fs.js";

export interface DoctorIssue {
  type: "missing-store-directory" | "broken-ide-link" | "untracked-ide-link";
  severity: "error" | "warning";
  message: string;
  path: string;
  ideId?: string;
  extensionKey?: string;
}

export interface DoctorReport {
  issues: DoctorIssue[];
}

/**
 * Runs a suite of health checks to ensure the registry, store, and IDE links are in sync.
 */
export async function runDoctor(registry: Registry): Promise<DoctorReport> {
  const issues: DoctorIssue[] = [];
  const data = registry.getAll();

  // 1. Verify existence of store directories for all registered extensions
  for (const [key, ext] of Object.entries(data.extensions)) {
    if (!(await pathExists(ext.storePath))) {
      issues.push({
        type: "missing-store-directory",
        severity: "error",
        message: `Extension "${key}" is registered but its store directory is missing.`,
        path: ext.storePath,
        extensionKey: key,
      });
    }

    // 2. Verify that IDEs listed as using this extension actually have the correct link
    for (const ideId of ext.usedBy) {
      const ide = data.ides[ideId];
      if (!ide || !ide.detected) continue;

      const ideEntryPath = path.join(ide.extensionsPath, key);
      const isTarget = await isSymlinkTo(ideEntryPath, ext.storePath);
      if (!isTarget) {
        issues.push({
          type: "broken-ide-link",
          severity: "error",
          message: `IDE "${ideId}" is supposed to use extension "${key}", but the link is missing or incorrect.`,
          path: ideEntryPath,
          ideId,
          extensionKey: key,
        });
      }
    }
  }

  // 3. Scan IDE folders for untracked ExtBridge links
  // (Links pointing to the store but not recorded in the registry's usedBy list)
  for (const [ideId, ide] of Object.entries(data.ides)) {
    if (!ide.detected || !(await pathExists(ide.extensionsPath))) continue;

    let entries;
    try {
      entries = await fs.readdir(ide.extensionsPath, { withFileTypes: true });
    } catch {
      continue;
    }

    const isWin = process.platform === "win32";

    for (const entry of entries) {
      // Junctions on Windows are directories, so we check both.
      if (!entry.isSymbolicLink() && (!isWin || !entry.isDirectory())) {
        continue;
      }

      const entryPath = path.join(ide.extensionsPath, entry.name);
      try {
        const rawTarget = await fs.readlink(entryPath);

        // Strip Windows junction prefixes
        const cleanTarget = isWin
          ? rawTarget.replace(/^\\\??\//u, "").replace(/^\\\?\\/u, "")
          : rawTarget;

        const resolvedActual = path.resolve(path.dirname(entryPath), cleanTarget);

        // Check if it points into our store
        // We look for the ".extbridge" and "store" segments in the resolved path
        const pathSegments = resolvedActual.split(path.sep);
        const isExtBridgeStore =
          pathSegments.includes(".extbridge") && pathSegments.includes("store");

        if (isExtBridgeStore) {
          const extKey = entry.name;
          const extRecord = data.extensions[extKey];
          if (!extRecord || !extRecord.usedBy.includes(ideId)) {
            issues.push({
              type: "untracked-ide-link",
              severity: "warning",
              message: `IDE "${ideId}" has a link for "${extKey}" pointing to the ExtBridge store, but it's not tracked in the registry.`,
              path: entryPath,
              ideId,
              extensionKey: extKey,
            });
          }
        }
      } catch {
        // Not a link or couldn't read target, ignore
      }
    }
  }

  return { issues };
}
