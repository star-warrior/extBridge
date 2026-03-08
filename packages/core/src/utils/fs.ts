import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isSymlinkTo(linkPath: string, targetPath: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(linkPath);
    const isWin = process.platform === "win32";

    // On Windows, junctions appear as directories (not symlinks).
    // On other platforms, only proceed if it's actually a symlink.
    if (!isWin && !stat.isSymbolicLink()) {
      return false;
    }
    if (isWin && !stat.isSymbolicLink() && !stat.isDirectory()) {
      // Neither a symlink nor a junction – can't be a link to anything.
      return false;
    }

    const rawTarget = await fs.readlink(linkPath);

    // Windows junctions return NT namespace paths like `\??\C:\...`.
    // Strip the prefix so path.resolve works correctly.
    const cleanTarget = isWin
      ? rawTarget.replace(/^\\\??\//u, "").replace(/^\\\?\\/u, "")
      : rawTarget;

    const resolvedActual = path.resolve(path.dirname(linkPath), cleanTarget);
    const resolvedTarget = path.resolve(targetPath);
    return resolvedActual === resolvedTarget;
  } catch {
    return false;
  }
}

export async function dirSize(dir: string): Promise<number> {
  let total = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(fullPath);
      continue;
    }
    if (entry.isFile()) {
      const stat = await fs.stat(fullPath);
      total += stat.size;
    }
  }
  return total;
}

export async function createDirectoryLink(targetPath: string, linkPath: string): Promise<void> {
  if (process.platform === "win32") {
    await fs.symlink(targetPath, linkPath, "junction");
    return;
  }
  await fs.symlink(targetPath, linkPath, "dir");
}
