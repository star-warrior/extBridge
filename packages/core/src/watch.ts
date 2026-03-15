import chokidar, { type FSWatcher } from "chokidar";
import path from "node:path";
import { deduplicateExtension, type ConflictStrategy } from "./dedup/dedup.js";
import type { Registry } from "./registry/registry.js";
import { pathExists } from "./utils/fs.js";

export interface WatcherOptions {
  storeDir: string;
  registry: Registry;
  strategy?: ConflictStrategy;
}

/**
 * Starts a background watcher that monitors IDE extension folders for new entries.
 * When a new extension is detected, it automatically attempts to deduplicate it.
 */
export function startWatcher(options: WatcherOptions): FSWatcher | null {
  const { storeDir, registry, strategy = "keep-both" } = options;
  const data = registry.getAll();

  // Collect all active extensions paths
  const pathsToWatch = Object.entries(data.ides)
    .filter(([, ide]) => ide.detected)
    .map(([, ide]) => ide.extensionsPath);

  if (pathsToWatch.length === 0) {
    return null;
  }

  const watcher = chokidar.watch(pathsToWatch, {
    depth: 0, // Only watch the direct children of the extensions directory
    ignoreInitial: true,
    persistent: true,
    // Avoid watching .obsolete or other temporary VS Code files
    ignored: [/\/\.obsolete$/, /\/\.cache$/],
  });

  watcher.on("addDir", async (dirPath) => {
    // dirPath is the path to the newly created extension folder
    const folderName = path.basename(dirPath);

    // Identify which IDE this folder belongs to
    const ideId = Object.keys(data.ides).find((id) =>
      path.resolve(dirPath).startsWith(path.resolve(data.ides[id].extensionsPath)),
    );

    if (!ideId) return;

    // Small delay to allow the IDE/installer to finish writing the directory content.
    // In high-traffic scenarios, a more robust check (polling for package.json) might be needed.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (!(await pathExists(dirPath))) {
      return;
    }

    try {
      // Re-load registry to ensure we have the latest state before deduping
      await registry.load();

      const result = await deduplicateExtension(
        dirPath,
        ideId,
        storeDir,
        registry,
        false,
        strategy,
      );

      await registry.save();

      if (result.action === "linked-existing") {
        console.log(`[Watcher] Deduplicated "${folderName}" (linked to existing)`);
      } else {
        console.log(`[Watcher] Deduplicated "${folderName}" (moved to store)`);
      }
    } catch (error) {
      console.error(`[Watcher] Failed to process ${folderName}:`, error);
    }
  });

  return watcher;
}
