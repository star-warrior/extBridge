import { importStoreToIde, Registry } from "@extbridge/core";
import { registryPath } from "../utils/paths.js";

export async function importIdeCommand(
  ideId: string,
  options: { dryRun?: boolean },
): Promise<void> {
  const dryRun = Boolean(options.dryRun);
  const registry = new Registry(registryPath);
  await registry.load();

  const report = await importStoreToIde(registry, ideId, dryRun);
  if (!dryRun) {
    await registry.save();
  }

  console.log(`Imported shared store extensions into IDE '${report.ideId}'`);
  console.log(`Linked: ${report.linked}`);
  console.log(`Already linked: ${report.alreadyLinked}`);
  console.log(`Skipped (missing store entries): ${report.skipped}`);
  console.log(`Failed: ${report.failed}`);

  if (report.failed > 0) {
    for (const failure of report.failures.slice(0, 10)) {
      console.log(`- ${failure.extensionKey} :: ${failure.code ?? "ERR"} ${failure.message}`);
    }
    if (report.failures.length > 10) {
      console.log(`...and ${report.failures.length - 10} more`);
    }
  }

  if (dryRun) {
    console.log("Dry-run mode: no file changes were made");
  }
}
