import fs from "node:fs/promises";
import path from "node:path";
import { emptyRegistry, type IDEEntry, RegistrySchema, type RegistryData } from "./schema.js";

export class Registry {
  private data: RegistryData = emptyRegistry();

  constructor(public readonly registryPath: string) {}

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.registryPath, "utf8");
      const parsed = JSON.parse(raw);
      this.data = RegistrySchema.parse(parsed);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        this.data = emptyRegistry();
        await this.save();
        return;
      }
      throw error;
    }
  }

  async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    await fs.writeFile(this.registryPath, JSON.stringify(this.data, null, 2));
  }

  getAll(): RegistryData {
    return this.data;
  }

  upsertIDE(ideId: string, entry: IDEEntry): void {
    this.data.ides[ideId] = entry;
  }

  findByHash(hash: string): [string, RegistryData["extensions"][string]] | undefined {
    return Object.entries(this.data.extensions).find(([, ext]) => ext.hash === hash);
  }

  upsertExtension(key: string, entry: RegistryData["extensions"][string]): void {
    this.data.extensions[key] = entry;
  }

  removeIDEUsage(extensionKey: string, ideId: string): void {
    const ext = this.data.extensions[extensionKey];
    if (!ext) {
      return;
    }
    ext.usedBy = ext.usedBy.filter((id) => id !== ideId);
    ext.refCount = ext.usedBy.length;
    if (ext.refCount === 0) {
      delete this.data.extensions[extensionKey];
    }
  }
}
