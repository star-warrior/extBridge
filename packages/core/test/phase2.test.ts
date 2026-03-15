import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { Registry } from "../src/registry/registry.js";
import { runDoctor } from "../src/doctor.js";
import { findOrphanedExtensions } from "../src/clean.js";
import { deduplicateExtension } from "../src/dedup/dedup.js";

describe("Phase 2 Logic", () => {
  let tmpDir: string;
  let storeDir: string;
  let ideDir: string;
  let registryPath: string;
  let registry: Registry;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "extbridge-test-phase2-"));
    storeDir = path.join(tmpDir, "store");
    ideDir = path.join(tmpDir, "vscode-ext");
    registryPath = path.join(tmpDir, "registry.json");

    await fs.mkdir(storeDir);
    await fs.mkdir(ideDir);

    registry = new Registry(registryPath);
    await registry.load();
    registry.upsertIDE("vscode", {
      name: "VS Code",
      extensionsPath: ideDir,
      detected: true,
    });
  });

  it("doctor detects missing store directory", async () => {
    // Setup a registered extension
    const extPathInStore = path.join(storeDir, "pub.ext-1.0.0");
    registry.upsertExtension("pub.ext-1.0.0", {
      id: "pub.ext",
      version: "1.0.0",
      storePath: extPathInStore,
      hash: "h1",
      installedAt: new Date().toISOString(),
      usedBy: ["vscode"],
      refCount: 1,
    });

    // MISSING on disk
    const report = await runDoctor(registry);
    const issue = report.issues.find((i) => i.type === "missing-store-directory");
    expect(issue).toBeDefined();
    expect(path.resolve(issue!.path)).toBe(path.resolve(extPathInStore));
  });

  it("clean detects orphaned store directory", async () => {
    const orphanPath = path.join(storeDir, "orphan-folder");
    await fs.mkdir(orphanPath);

    const report = await findOrphanedExtensions(storeDir, registry);
    expect(report.orphanedFolders).toContain("orphan-folder");
    expect(report.orphanedFolders.length).toBe(1);
  });

  it("conflict resolution: latest-wins linked to better version", async () => {
    // 1. Put version 1.0.0 in store
    const v1StorePath = path.join(storeDir, "pub.ext-1.0.0");
    await fs.mkdir(v1StorePath);
    registry.upsertExtension("pub.ext-1.0.0", {
      id: "pub.ext",
      version: "1.0.0",
      storePath: v1StorePath,
      hash: "h1",
      installedAt: new Date().toISOString(),
      usedBy: [],
      refCount: 0,
    });

    // 2. Mock an IDE folder with version 0.9.0
    const v09IdePath = path.join(ideDir, "pub.ext-0.9.0");
    await fs.mkdir(v09IdePath);
    await fs.writeFile(path.join(v09IdePath, "something"), "content");

    // 3. Deduplicate with latest-wins
    const result = await deduplicateExtension(
      v09IdePath,
      "vscode",
      storeDir,
      registry,
      false,
      "latest-wins",
    );

    expect(result.action).toBe("linked-existing");
    expect(result.key).toBe("pub.ext-1.0.0"); // Should have linked to the better version

    // Verify folder v09 was deleted and replaced by link/junction
    const stat = await fs.lstat(v09IdePath);

    if (process.platform === "win32") {
      // On Windows, junctions are directories and NOT symlinks in some Node FS implementations,
      // but lstat might show isSymbolicLink true for modern node + developer mode.
      expect(stat.isDirectory() || stat.isSymbolicLink()).toBe(true);
    } else {
      expect(stat.isSymbolicLink()).toBe(true);
    }
  });
});
