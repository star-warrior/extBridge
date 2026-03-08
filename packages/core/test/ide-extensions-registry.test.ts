import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { upsertIdeExtensionEntry } from "../src/utils/ide-extensions-registry.js";

/**
 * Write a minimal extension package.json to simulate a real extension folder.
 */
async function writeExtensionPackageJson(
  extensionsDir: string,
  folderName: string,
  pkg: Record<string, unknown>,
): Promise<void> {
  const extDir = path.join(extensionsDir, folderName);
  await fs.mkdir(extDir, { recursive: true });
  await fs.writeFile(path.join(extDir, "package.json"), JSON.stringify(pkg));
}

describe("upsertIdeExtensionEntry", () => {
  let extensionsDir: string;

  beforeEach(async () => {
    extensionsDir = await fs.mkdtemp(path.join(os.tmpdir(), "extbridge-ide-reg-"));
  });

  afterEach(async () => {
    await fs.rm(extensionsDir, { recursive: true, force: true });
  });

  it("creates extensions.json from scratch when file is absent", async () => {
    const folderName = "ms-python.python-2026.2.0-universal";
    await writeExtensionPackageJson(extensionsDir, folderName, {
      name: "python",
      publisher: "ms-python",
      version: "2026.2.0",
    });

    await upsertIdeExtensionEntry(extensionsDir, folderName);

    const raw = await fs.readFile(path.join(extensionsDir, "extensions.json"), "utf8");
    const entries = JSON.parse(raw) as Array<{
      identifier: { id: string };
      version: string;
      relativeLocation: string;
    }>;

    expect(entries).toHaveLength(1);
    expect(entries[0]!.identifier.id).toBe("ms-python.python");
    expect(entries[0]!.version).toBe("2026.2.0");
    expect(entries[0]!.relativeLocation).toBe(folderName);
  });

  it("upserts without creating a duplicate for the same folder name", async () => {
    const folderName = "pkief.material-icon-theme-5.32.0-universal";
    await writeExtensionPackageJson(extensionsDir, folderName, {
      name: "material-icon-theme",
      publisher: "pkief",
      version: "5.32.0",
    });

    // Call twice with the same folder — should result in exactly one entry.
    await upsertIdeExtensionEntry(extensionsDir, folderName);
    await upsertIdeExtensionEntry(extensionsDir, folderName);

    const raw = await fs.readFile(path.join(extensionsDir, "extensions.json"), "utf8");
    const entries = JSON.parse(raw) as Array<{ identifier: { id: string } }>;

    const matches = entries.filter((e) => e.identifier.id === "pkief.material-icon-theme");
    expect(matches).toHaveLength(1);
  });

  it("keeps separate entries for different platform variants of the same extension", async () => {
    // VS Code-family IDEs can install both a 'universal' and a 'win32-x64' variant
    // of the same extension. Each gets its own extensions.json entry.
    const universalFolder = "ms-python.python-2026.2.0-universal";
    const win32Folder = "ms-python.python-2026.2.0-win32-x64";
    const pkg = { name: "python", publisher: "ms-python", version: "2026.2.0" };

    await writeExtensionPackageJson(extensionsDir, universalFolder, pkg);
    await writeExtensionPackageJson(extensionsDir, win32Folder, pkg);

    await upsertIdeExtensionEntry(extensionsDir, universalFolder);
    await upsertIdeExtensionEntry(extensionsDir, win32Folder);

    const raw = await fs.readFile(path.join(extensionsDir, "extensions.json"), "utf8");
    const entries = JSON.parse(raw) as Array<{
      identifier: { id: string };
      relativeLocation: string;
    }>;

    // Both variants must appear as separate entries.
    expect(entries).toHaveLength(2);
    const locations = entries.map((e) => e.relativeLocation);
    expect(locations).toContain(universalFolder);
    expect(locations).toContain(win32Folder);
  });

  it("does not throw when the extension package.json is missing", async () => {
    // Folder exists but no package.json inside.
    await fs.mkdir(path.join(extensionsDir, "bad-extension-1.0.0"), {
      recursive: true,
    });

    // Should resolve without error — no extensions.json written.
    await expect(
      upsertIdeExtensionEntry(extensionsDir, "bad-extension-1.0.0"),
    ).resolves.toBeUndefined();
  });

  it("preserves existing entries and appends new ones", async () => {
    // Pre-populate extensions.json with one entry.
    const existing = [
      {
        identifier: { id: "someone.existing", uuid: "abc-123" },
        version: "1.0.0",
        location: { $mid: 1, path: "/c:/fake/path", scheme: "file" },
        relativeLocation: "someone.existing-1.0.0",
        metadata: { installedTimestamp: 1000000 },
      },
    ];
    await fs.writeFile(path.join(extensionsDir, "extensions.json"), JSON.stringify(existing));

    const newFolder = "eamodio.gitlens-16.0.0-universal";
    await writeExtensionPackageJson(extensionsDir, newFolder, {
      name: "gitlens",
      publisher: "eamodio",
      version: "16.0.0",
    });

    await upsertIdeExtensionEntry(extensionsDir, newFolder);

    const raw = await fs.readFile(path.join(extensionsDir, "extensions.json"), "utf8");
    const entries = JSON.parse(raw) as Array<{ identifier: { id: string } }>;

    expect(entries).toHaveLength(2);
    expect(entries.some((e) => e.identifier.id === "someone.existing")).toBe(true);
    expect(entries.some((e) => e.identifier.id === "eamodio.gitlens")).toBe(true);
  });
});
