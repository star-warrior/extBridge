import {
  findOrphanedExtensions,
  Registry,
  removeOrphanedExtensions,
} from "@iamjarvis/extbridge-core";
import { registryPath, storeDir } from "../utils/paths.js";

/**
 * CLI command to list and remove orphaned extension folders from the shared store.
 */
export async function cleanCommand(options: { dryRun?: boolean; force?: boolean }): Promise<void> {
  const registry = new Registry(registryPath);
  await registry.load();

  console.log("🧹 Scanning for orphaned extensions in the shared store...");
  const report = await findOrphanedExtensions(storeDir, registry);

  if (report.orphanedFolders.length === 0) {
    console.log("✨ No orphaned extensions found. The shared store is clean!");
    return;
  }

  console.log(`Found ${report.orphanedFolders.length} orphaned folder(s):`);
  for (const folder of report.orphanedFolders) {
    console.log(` - ${folder}`);
  }

  if (options.dryRun) {
    console.log("\n[Dry Run] No files were removed.");
    return;
  }

  if (!options.force) {
    console.log("\n⚠️ Use '--force' to permanently delete these folders.");
    return;
  }

  console.log("\n🚀 Removing orphaned extensions...");
  await removeOrphanedExtensions(storeDir, report.orphanedFolders);
  console.log("✅ Cleanup complete.");
}
