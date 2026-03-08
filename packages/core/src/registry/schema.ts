import { z } from "zod";

export const ExtensionEntrySchema = z.object({
  id: z.string(),
  version: z.string(),
  storePath: z.string(),
  hash: z.string(),
  installedAt: z.string(),
  usedBy: z.array(z.string()),
  refCount: z.number().int().nonnegative(),
});

export const IDEEntrySchema = z.object({
  name: z.string(),
  extensionsPath: z.string(),
  detected: z.boolean(),
});

export const RegistrySchema = z.object({
  version: z.string(),
  extensions: z.record(ExtensionEntrySchema),
  ides: z.record(IDEEntrySchema),
});

export type ExtensionEntry = z.infer<typeof ExtensionEntrySchema>;
export type IDEEntry = z.infer<typeof IDEEntrySchema>;
export type RegistryData = z.infer<typeof RegistrySchema>;

export const emptyRegistry = (): RegistryData => ({
  version: "1.0.0",
  extensions: {},
  ides: {},
});
