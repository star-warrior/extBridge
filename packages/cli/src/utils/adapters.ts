import fs from "node:fs";
import { defaultAdapters, type IDEAdapter, type Registry } from "@iamjarvis/extbridge-core";

export function getEffectiveAdapters(registry: Registry): IDEAdapter[] {
  const builtIn = new Map(defaultAdapters.map((adapter) => [adapter.id, adapter]));
  const custom = Object.entries(registry.getAll().ides)
    .filter(([ideId]) => !builtIn.has(ideId))
    .map(([ideId, ide]) => {
      const adapter: IDEAdapter = {
        id: ideId,
        name: ide.name,
        getExtensionsPath: () => ide.extensionsPath,
        isInstalled: () => fs.existsSync(ide.extensionsPath),
      };
      return adapter;
    });

  return [...defaultAdapters, ...custom];
}
