import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Registry } from "../src/registry/registry.js";

describe("registry", () => {
  it("creates and persists data", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "extbridge-registry-"));
    const registryPath = path.join(root, "registry.json");

    const registry = new Registry(registryPath);
    await registry.load();
    registry.upsertIDE("vscode", {
      name: "VS Code",
      extensionsPath: "/tmp/.vscode/extensions",
      detected: true,
    });
    await registry.save();

    const reloaded = new Registry(registryPath);
    await reloaded.load();
    expect(reloaded.getAll().ides.vscode?.name).toBe("VS Code");
  });
});
