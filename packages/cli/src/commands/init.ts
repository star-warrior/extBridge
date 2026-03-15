import { initializeStore, Registry, type ConflictStrategy } from "@iamjarvis/extbridge-core";
import { registryPath, storeDir } from "../utils/paths.js";
import { getEffectiveAdapters } from "../utils/adapters.js";

export async function initCommand(options: {
  dryRun?: boolean;
  conflict?: ConflictStrategy;
}): Promise<void> {
  const dryRun = Boolean(options.dryRun);
  const registry = new Registry(registryPath);
  await registry.load();
  const adapters = getEffectiveAdapters(registry);

  const report = await initializeStore(adapters, storeDir, registry, dryRun, options.conflict);

  if (!dryRun) {
    await registry.save();
  }

  console.log("ExtBridge init complete");
  console.log(`Detected IDEs: ${report.detectedIDEs.join(", ") || "none"}`);
  console.log(`Scanned extensions: ${report.scannedExtensions}`);
  console.log(`Linked existing: ${report.linkedExisting}`);
  console.log(`Moved to store: ${report.movedNew}`);
  console.log(`Failed: ${report.failed}`);

  if (report.failed > 0) {
    console.log(
      "Some extensions could not be processed (often because files are locked by a running IDE).",
    );
    console.log("Close all VS Code-based IDEs and run init again.");
    for (const failure of report.failures.slice(0, 10)) {
      console.log(
        `- [${failure.ideId}] ${failure.extensionPath} :: ${failure.code ?? "ERR"} ${failure.message}`,
      );
    }
    if (report.failures.length > 10) {
      console.log(`...and ${report.failures.length - 10} more`);
    }
  }

  if (dryRun) {
    console.log("Dry-run mode: no file changes were made");
  }
}
