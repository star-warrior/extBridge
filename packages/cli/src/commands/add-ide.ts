import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultAdapters, Registry } from "@iamjarvis/extbridge-core";
import { registryPath } from "../utils/paths.js";

function normalizeIdeId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}

const ideAliases: Record<string, string> = {
  "vs-code": "vscode",
  "visual-studio-code": "vscode",
  code: "vscode",
  "code-oss": "vscodium",
  codium: "vscodium",
  "vscode-oss": "vscodium",
  ai: "cursor",
};

function resolveKnownIdeId(normalizedIdeId: string): string {
  return ideAliases[normalizedIdeId] ?? normalizedIdeId;
}

function fallbackCandidatePaths(ideId: string): string[] {
  const home = os.homedir();
  return [
    path.join(home, `.${ideId}`, "extensions"),
    path.join(home, ".config", ideId, "extensions"),
    path.join(home, "AppData", "Roaming", ideId, "extensions"),
  ];
}

function knownExtensionsPathForIde(ideId: string): string | undefined {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");

  switch (ideId) {
    case "vscode":
      return path.join(home, ".vscode", "extensions");
    case "cursor":
      return path.join(home, ".cursor", "extensions");
    case "windsurf":
      return path.join(home, ".windsurf", "extensions");
    case "vscodium":
      return path.join(home, ".vscode-oss", "extensions");
    case "zed":
      if (process.platform === "win32") {
        return path.join(localAppData, "Zed", "extensions");
      }
      if (process.platform === "darwin") {
        return path.join(home, "Library", "Application Support", "Zed", "extensions");
      }
      return path.join(home, ".local", "share", "zed", "extensions");
    default:
      return undefined;
  }
}

async function resolveExtensionsPath(
  normalizedIdeId: string,
  explicitPath?: string,
): Promise<string> {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }

  const resolvedIdeId = resolveKnownIdeId(normalizedIdeId);
  const knownPath = knownExtensionsPathForIde(resolvedIdeId);
  if (knownPath) {
    return knownPath;
  }

  const known = defaultAdapters.find((adapter) => adapter.id === resolvedIdeId);
  if (known) {
    return known.getExtensionsPath();
  }

  for (const candidate of fallbackCandidatePaths(resolvedIdeId)) {
    const stat = await fs.stat(candidate).catch(() => null);
    if (stat?.isDirectory()) {
      return candidate;
    }
  }

  throw new Error(
    `Could not auto-detect extensions path for '${normalizedIdeId}'. ` +
      "Provide it manually: add-ide <id> <extensionsPath>",
  );
}

export async function addIdeCommand(
  ideId: string,
  extensionsPath: string | undefined,
  options: { name?: string },
): Promise<void> {
  const normalizedIdeId = normalizeIdeId(ideId);
  if (!normalizedIdeId) {
    throw new Error("IDE id cannot be empty");
  }

  const resolvedPath = await resolveExtensionsPath(normalizedIdeId, extensionsPath);
  const stat = await fs.stat(resolvedPath).catch(() => null);
  if (stat && !stat.isDirectory()) {
    throw new Error(`Extensions path exists but is not a directory: ${resolvedPath}`);
  }
  if (!stat) {
    await fs.mkdir(resolvedPath, { recursive: true });
  }

  const registry = new Registry(registryPath);
  await registry.load();

  registry.upsertIDE(normalizedIdeId, {
    name: options.name?.trim() || ideId,
    extensionsPath: resolvedPath,
    detected: true,
  });

  await registry.save();

  console.log(`Registered IDE '${normalizedIdeId}' at ${resolvedPath}`);
}
