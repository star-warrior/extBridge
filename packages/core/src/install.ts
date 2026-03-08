import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import unzipper from "unzipper";
import { hashDirectory } from "./dedup/hash.js";
import type { Registry } from "./registry/registry.js";
import { ensureDir, pathExists } from "./utils/fs.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtensionMeta {
  namespace: string;
  name: string;
  version: string;
  downloadUrl: string;
  /** The folder name that will be used in the store, e.g. "ms-python.python-2026.2.0-universal" */
  folderName: string;
}

export interface InstallResult {
  /** Registry key, same as folderName */
  key: string;
  storePath: string;
  /** true when the extension was already in the store (same hash) and was not re-downloaded */
  alreadyInstalled: boolean;
}

// ---------------------------------------------------------------------------
// Open VSX API
// ---------------------------------------------------------------------------

interface OpenVsxResponse {
  namespace: string;
  name: string;
  version: string;
  targetPlatform?: string;
  files: {
    download: string;
  };
}

/**
 * Fetch extension metadata from Open VSX.
 *
 * @param extensionId  "publisher.name" (e.g. "ms-python.python")
 * @param version      Optional specific version; defaults to latest
 */
export async function fetchExtensionMeta(
  extensionId: string,
  version?: string,
): Promise<ExtensionMeta> {
  const parts = extensionId.split(".");
  if (parts.length < 2) {
    throw new Error(
      `Invalid extension ID "${extensionId}". Expected format: publisher.name (e.g. ms-python.python)`,
    );
  }

  // Support publisher.name with dots in the name (e.g. "ms-python.python")
  const namespace = parts[0]!;
  const name = parts.slice(1).join(".");

  const url = version
    ? `https://open-vsx.org/api/${namespace}/${name}/${version}`
    : `https://open-vsx.org/api/${namespace}/${name}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`Network error fetching extension info for "${extensionId}": ${String(err)}`, {
      cause: err,
    });
  }

  if (res.status === 404) {
    throw new Error(
      `Extension "${extensionId}" not found on Open VSX.` +
        (version ? ` Version "${version}" may not exist.` : ""),
    );
  }
  if (!res.ok) {
    throw new Error(`Open VSX API returned HTTP ${res.status} for "${extensionId}"`);
  }

  const data = (await res.json()) as OpenVsxResponse;

  const downloadUrl = data.files?.download;
  if (!downloadUrl) {
    throw new Error(`No download URL found for "${extensionId}" @${data.version}`);
  }

  // Build the folder name: publisher.name-version[-platform]
  const platform =
    data.targetPlatform && data.targetPlatform !== "universal"
      ? `-${data.targetPlatform}`
      : data.targetPlatform === "universal"
        ? "-universal"
        : "";
  const folderName = `${namespace}.${name}-${data.version}${platform}`;

  return {
    namespace,
    name,
    version: data.version,
    downloadUrl,
    folderName,
  };
}

// ---------------------------------------------------------------------------
// Download + Extract
// ---------------------------------------------------------------------------

/**
 * Download the VSIX to a temp file, extract the `extension/` subfolder to
 * destDir, and return the path to the extracted extension folder.
 */
async function downloadAndExtract(downloadUrl: string, destDir: string): Promise<void> {
  // 1. Download VSIX to a temp file
  let res: Response;
  try {
    res = await fetch(downloadUrl);
  } catch (err) {
    throw new Error(`Network error downloading VSIX: ${String(err)}`, { cause: err });
  }
  if (!res.ok) {
    throw new Error(`Failed to download VSIX: HTTP ${res.status} from ${downloadUrl}`);
  }
  if (!res.body) {
    throw new Error("Download response has no body");
  }

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "extbridge-vsix-"));
  const vsixPath = path.join(tmpDir, "extension.vsix");

  // Write the downloaded bytes to the temp file
  const fileStream = fs.createWriteStream(vsixPath);
  const reader = res.body.getReader();
  await new Promise<void>((resolve, reject) => {
    function pump(): void {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            fileStream.end();
            return;
          }
          fileStream.write(value, (err) => {
            if (err) {
              reject(err);
              return;
            }
            pump();
          });
        })
        .catch(reject);
    }
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
    pump();
  });

  // 2. Extract VSIX (it's a ZIP). The extension content lives in an `extension/` sub-folder.
  const extractDir = path.join(tmpDir, "extracted");
  await fsp.mkdir(extractDir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(vsixPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .on("close", resolve)
      .on("error", reject);
  });

  // 3. Move the `extension/` subfolder content to destDir
  const extensionSubDir = path.join(extractDir, "extension");
  if (!(await pathExists(extensionSubDir))) {
    throw new Error(
      "VSIX did not contain an 'extension/' subfolder. The package may be malformed.",
    );
  }

  await fsp.rename(extensionSubDir, destDir);

  // 4. Clean up temp dir
  await fsp.rm(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Unique store path helper (same pattern as dedup.ts)
// ---------------------------------------------------------------------------

async function uniqueStorePath(basePath: string): Promise<string> {
  if (!(await pathExists(basePath))) {
    return basePath;
  }
  let counter = 1;
  while (true) {
    const candidate = `${basePath}-${counter}`;
    if (!(await pathExists(candidate))) {
      return candidate;
    }
    counter += 1;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Download an extension from Open VSX and install it into the shared store.
 *
 * @param extensionId  "publisher.name" (e.g. "ms-python.python")
 * @param storeDir     Path to the shared store root (e.g. ~/.extbridge/store)
 * @param registry     The loaded Registry instance
 * @param version      Optional specific version; defaults to "latest"
 * @param dryRun       If true, resolves metadata only — no files are written
 */
export async function installExtension(
  extensionId: string,
  storeDir: string,
  registry: Registry,
  version?: string,
  dryRun = false,
): Promise<InstallResult> {
  const meta = await fetchExtensionMeta(extensionId, version);

  if (dryRun) {
    return {
      key: meta.folderName,
      storePath: path.join(storeDir, meta.folderName),
      alreadyInstalled: false,
    };
  }

  await ensureDir(storeDir);

  const preferredStorePath = path.join(storeDir, meta.folderName);
  const finalStorePath = await uniqueStorePath(preferredStorePath);
  const key = path.basename(finalStorePath);

  // Download + extract the VSIX
  await downloadAndExtract(meta.downloadUrl, finalStorePath);

  // Hash the extracted folder so we can dedup future installs
  const hash = await hashDirectory(finalStorePath);

  // Check if an identical extension is already in the store
  const existing = registry.findByHash(hash);
  if (existing) {
    const [existingKey] = existing;
    // Remove the just-extracted duplicate
    await fsp.rm(finalStorePath, { recursive: true, force: true });
    return {
      key: existingKey,
      storePath: existing[1].storePath,
      alreadyInstalled: true,
    };
  }

  // Register the new store entry
  registry.upsertExtension(key, {
    id: `${meta.namespace}.${meta.name}`.toLowerCase(),
    version: meta.version,
    storePath: finalStorePath,
    hash,
    installedAt: new Date().toISOString(),
    usedBy: [],
    refCount: 0,
  });

  return { key, storePath: finalStorePath, alreadyInstalled: false };
}
