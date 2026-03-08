import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Shape of a single entry in an IDE's extensions.json.
 * All VS Code-family IDEs (VS Code, Antigravity, Cursor, Windsurf, VSCodium)
 * share this format.
 */
interface IdeExtensionEntry {
  identifier: { id: string; uuid?: string };
  version: string;
  location: {
    $mid: number;
    path: string;
    scheme: string;
  };
  relativeLocation: string;
  metadata: {
    installedTimestamp: number;
    pinned?: boolean;
    source?: string;
    [key: string]: unknown;
  };
}

/**
 * Minimal subset of an extension's package.json that we need.
 */
interface ExtensionPackageJson {
  name?: string;
  version?: string;
  publisher?: string;
}

/**
 * Convert an absolute Windows/posix path into the forward-slash URI path
 * format that VS Code-family IDEs store in extensions.json.
 * e.g. "C:\Users\Jay\.antigravity\extensions\foo-1.0.0"
 *   -> "/c:/Users/Jay/.antigravity/extensions/foo-1.0.0"
 */
function toLocationPath(absolutePath: string): string {
  // Normalise to forward slashes
  const normalised = absolutePath.replace(/\\/gu, "/");
  // On Windows drive letters need to become lowercase and prefixed with /
  // e.g.  C:/foo  ->  /c:/foo
  if (/^[A-Za-z]:\//u.test(normalised)) {
    return `/${normalised.charAt(0).toLowerCase()}:${normalised.slice(2)}`;
  }
  return normalised;
}

/**
 * Read and parse the IDE's extensions.json.
 * Returns an empty array if the file is absent or malformed.
 */
async function loadIdeExtensionsJson(extensionsJsonPath: string): Promise<IdeExtensionEntry[]> {
  try {
    const raw = await fs.readFile(extensionsJsonPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as IdeExtensionEntry[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Atomically write the extensions.json array back to disk.
 * Uses a temp file + rename so the file is never partially written.
 */
async function saveIdeExtensionsJson(
  extensionsJsonPath: string,
  entries: IdeExtensionEntry[],
): Promise<void> {
  const dir = path.dirname(extensionsJsonPath);
  const tmpPath = path.join(dir, `.extensions.json.tmp.${process.pid}`);
  await fs.writeFile(tmpPath, JSON.stringify(entries));
  await fs.rename(tmpPath, extensionsJsonPath);
}

/**
 * Upsert a single extension entry into an IDE's extensions.json.
 *
 * @param extensionsDir  - Absolute path to the IDE's extensions folder
 *                         (e.g. ~/.antigravity/extensions)
 * @param extFolderName  - Name of the extension sub-folder
 *                         (e.g. "ms-python.python-2026.2.0-universal")
 *
 * The function is a no-op (non-throwing) when the extension's
 * package.json cannot be read, so a single bad extension never
 * blocks the rest of the operation.
 */
export async function upsertIdeExtensionEntry(
  extensionsDir: string,
  extFolderName: string,
): Promise<void> {
  const pkgJsonPath = path.join(extensionsDir, extFolderName, "package.json");

  let pkg: ExtensionPackageJson;
  try {
    const raw = await fs.readFile(pkgJsonPath, "utf8");
    pkg = JSON.parse(raw) as ExtensionPackageJson;
  } catch {
    // Extension package.json missing or unreadable — skip silently.
    return;
  }

  const publisher = pkg.publisher ?? "";
  const name = pkg.name ?? extFolderName;
  // package.json `name` may already be "publisher.extension" or just "extension"
  const extensionId = name.includes(".")
    ? name.toLowerCase()
    : `${publisher.toLowerCase()}.${name.toLowerCase()}`;
  const version = pkg.version ?? "0.0.0";

  const extAbsPath = path.join(extensionsDir, extFolderName);
  const entry: IdeExtensionEntry = {
    identifier: { id: extensionId },
    version,
    location: {
      $mid: 1,
      path: toLocationPath(extAbsPath),
      scheme: "file",
    },
    relativeLocation: extFolderName,
    metadata: {
      installedTimestamp: Date.now(),
      pinned: false,
      source: "extbridge",
    },
  };

  const extensionsJsonPath = path.join(extensionsDir, "extensions.json");
  const entries = await loadIdeExtensionsJson(extensionsJsonPath);

  // Deduplicate by relativeLocation (folder name), NOT by identifier.id.
  // VS Code-family IDEs can have multiple platform variants of the same extension
  // (e.g. "ms-python.python-2026.2.0-universal" and "ms-python.python-2026.2.0-win32-x64")
  // each with the same identifier.id but different folders — they need separate entries.
  const existingIndex = entries.findIndex((e) => e.relativeLocation === extFolderName);
  if (existingIndex >= 0) {
    // Preserve original metadata (UUID, publisherId, etc.) — only update version/location.
    const existing = entries[existingIndex]!;
    entries[existingIndex] = {
      ...existing,
      version: entry.version,
      location: entry.location,
      relativeLocation: entry.relativeLocation,
    };
  } else {
    entries.push(entry);
  }

  await saveIdeExtensionsJson(extensionsJsonPath, entries);
}

/** Cross-platform home directory helper (re-exported for tests). */
export const homeDir = (): string => os.homedir();
