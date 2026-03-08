import {
  Registry,
  fetchExtensionMeta,
  installExtension,
  syncRegistryLinks,
} from "@iamjarvis/extbridge-core";
import { registryPath, storeDir } from "../utils/paths.js";
import { getEffectiveAdapters } from "../utils/adapters.js";

export async function addCommand(
  extensionId: string,
  options: { version?: string; noSync?: boolean; dryRun?: boolean },
): Promise<void> {
  const dryRun = Boolean(options.dryRun);

  // --dry-run: just resolve and print metadata, touch nothing
  if (dryRun) {
    console.log(`Resolving extension info for "${extensionId}"...`);
    const meta = await fetchExtensionMeta(extensionId, options.version);
    console.log(`Would install: ${meta.namespace}.${meta.name} @ ${meta.version}`);
    console.log(`  Download URL : ${meta.downloadUrl}`);
    console.log(`  Store folder : ${meta.folderName}`);
    console.log("Dry-run mode: no files were modified.");
    return;
  }

  const registry = new Registry(registryPath);
  await registry.load();

  // 1. Download + install into the store
  process.stdout.write(
    `Fetching "${extensionId}"${options.version ? ` @ ${options.version}` : ""}... `,
  );
  let result: Awaited<ReturnType<typeof installExtension>>;
  try {
    result = await installExtension(extensionId, storeDir, registry, options.version);
  } catch (err) {
    console.log(""); // newline after the "Fetching..." prompt
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
    return;
  }

  if (result.alreadyInstalled) {
    console.log("already in store.");
    console.log(`  Store path: ${result.storePath}`);
  } else {
    console.log("done.");
    console.log(`  Installed to store: ${result.storePath}`);
  }

  await registry.save();

  // 2. Sync to all detected IDEs (unless --no-sync)
  if (!options.noSync) {
    const adapters = getEffectiveAdapters(registry);
    const detected = adapters.filter((a) => a.isInstalled());

    if (detected.length === 0) {
      console.log("No IDEs detected — extension is in the store but not yet linked.");
      console.log('Run "extbridge import-ide <id>" to link it manually.');
      return;
    }

    // Register the new extension as "usedBy" all detected IDEs so sync picks it up
    const data = registry.getAll();
    const ext = data.extensions[result.key];
    if (ext) {
      for (const adapter of detected) {
        if (!ext.usedBy.includes(adapter.id)) {
          ext.usedBy.push(adapter.id);
          ext.refCount = ext.usedBy.length;
          registry.upsertExtension(result.key, ext);
        }
      }
      await registry.save();
    }

    process.stdout.write(`Syncing to ${detected.length} IDE(s)... `);
    await syncRegistryLinks(registry, storeDir);
    await registry.save();
    console.log("done.");

    for (const adapter of detected) {
      console.log(`  ✔ ${adapter.name}`);
    }
  } else {
    console.log('Run "extbridge sync" to link this extension to your IDEs.');
  }
}
