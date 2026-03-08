import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

async function walkFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath, base)));
      continue;
    }
    if (entry.isFile()) {
      files.push(path.relative(base, fullPath));
    }
  }
  return files.sort();
}

export async function hashDirectory(dir: string): Promise<string> {
  const hash = createHash("sha256");
  const files = await walkFiles(dir);
  for (const relativePath of files) {
    const absolutePath = path.join(dir, relativePath);
    const content = await fs.readFile(absolutePath);
    hash.update(relativePath);
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}
