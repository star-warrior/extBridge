import { collectStatus, formatBytes, Registry } from "@iamjarvis/extbridge-core";
import { registryPath } from "../utils/paths.js";
import { getEffectiveAdapters } from "../utils/adapters.js";

export async function statusCommand(): Promise<void> {
  const registry = new Registry(registryPath);
  await registry.load();
  const adapters = getEffectiveAdapters(registry);

  const status = await collectStatus(registry, adapters);
  console.log("ExtBridge status");
  for (const ide of status.ides) {
    console.log(
      `- ${ide.name} (${ide.ideId}): ${ide.detected ? "detected" : "not detected"}, ` +
        `${ide.extensionCount} extension folders`,
    );
  }

  console.log(`Shared extensions: ${status.sharedExtensions}/${status.totalExtensions}`);
  console.log(`Estimated disk saved: ${formatBytes(status.estimatedBytesSaved)}`);
}
