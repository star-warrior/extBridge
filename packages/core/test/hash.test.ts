import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hashDirectory } from "../src/dedup/hash.js";

describe("hashDirectory", () => {
  it("produces same hash for same content", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "extbridge-hash-"));
    const dirA = path.join(root, "a");
    const dirB = path.join(root, "b");
    await fs.mkdir(dirA, { recursive: true });
    await fs.mkdir(dirB, { recursive: true });

    await fs.writeFile(path.join(dirA, "x.txt"), "hello");
    await fs.writeFile(path.join(dirB, "x.txt"), "hello");

    const hashA = await hashDirectory(dirA);
    const hashB = await hashDirectory(dirB);

    expect(hashA).toBe(hashB);
  });
});
