import { Registry, syncRegistryLinks, type ConflictStrategy } from "@iamjarvis/extbridge-core";
import { registryPath, storeDir } from "../utils/paths.js";

export async function syncCommand(options: {
  dryRun?: boolean;
  conflict?: ConflictStrategy;
}): Promise<void> {
  const dryRun = Boolean(options.dryRun);
  const registry = new Registry(registryPath);
  await registry.load();

  const result = await syncRegistryLinks(registry, storeDir, dryRun, options.conflict);
  if (!dryRun) {
    await registry.save();
  }

  console.log("ExtBridge sync complete");
  console.log(`Discovered new extensions: ${result.discovered}`);
  console.log(`Repaired links: ${result.repaired}`);
  console.log(`Skipped entries: ${result.skipped}`);
  if (result.failedDiscovery > 0) {
    console.log(`Discovery failures: ${result.failedDiscovery}`);
  }
  if (dryRun) {
    console.log("Dry-run mode: no file changes were made");
  }
}
