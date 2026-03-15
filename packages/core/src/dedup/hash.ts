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

  // Read in chunks to speed up I/O dramatically on Windows,
  // but update the hash sequentially to maintain deterministic output.
  const chunkSize = 50;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const contents = await Promise.all(
      chunk.map(async (file) => {
        const absolutePath = path.join(dir, file);
        return { file, data: await fs.readFile(absolutePath) };
      }),
    );
    for (const item of contents) {
      hash.update(item.file);
      hash.update("\0");
      hash.update(item.data);
      hash.update("\0");
    }
  }
  return `sha256:${hash.digest("hex")}`;
}
