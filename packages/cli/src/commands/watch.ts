import { Registry, startWatcher, type ConflictStrategy } from "@iamjarvis/extbridge-core";
import { registryPath, storeDir } from "../utils/paths.js";

/**
 * CLI command to start the background watcher daemon.
 */
export async function watchCommand(options: { conflict?: ConflictStrategy }): Promise<void> {
  const registry = new Registry(registryPath);
  await registry.load();

  console.log("👁️ ExtBridge Watcher started.");
  console.log("Monitoring IDE extension folders for real-time deduplication...");

  const watcher = startWatcher({
    storeDir,
    registry,
    strategy: options.conflict,
  });

  if (!watcher) {
    console.error("❌ Failed to start watcher. No active IDEs detected in the registry.");
    process.exit(1);
  }

  watcher.on("error", (error: unknown) => {
    console.error("Watcher error:", error);
  });

  // Handle termination gracefully
  process.on("SIGINT", async () => {
    console.log("\n🛑 Stopping watcher...");
    await watcher.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await watcher.close();
    process.exit(0);
  });
}
