# ExtBridge Core API Documentation

`@iamjarvis/extbridge-core` is the engine that drives the ExtBridge extension deduplication platform. It provides a robust set of utilities for managing VS Code extensions, scanning local filesystems, securely hashing directories, and downloading artifacts from the Open VSX marketplace.

## 📦 Installation

```bash
npm install @iamjarvis/extbridge-core
```

## 🧩 Architecture

The core relies on a shared file-based registry located conventionally in `~/.extbridge/registry.json`.

All file interactions are verified using SHA-256 hashing. Rather than duplicating extension data, the core utilizes junction points (Windows) or symlinks (Unix) to point disparate IDE extension folders to a single unified store located at `~/.extbridge/store`.

## 🛠️ Main Modules

The package exports everything from `src/index.ts`, primarily organized into the following domains:

### 1. **Registry (`Registry`, `readRegistry`, `writeRegistry`)**

The `Registry` is the single source of truth, tracking which IDEs are registered, which extensions are stored globally, and which IDE "owns" (links to) which extension.

```typescript
import { readRegistry, writeRegistry, Registry } from "@iamjarvis/extbridge-core";

const registry = await readRegistry("/path/to/registry.json");
console.log(registry.ides);
```

### 2. **IDE Adapters (`defaultAdapters`, `IDEAdapter`)**

Adapters define how to detect and interact with different VS Code forks. Default adapters include: VS Code, VSCodium, Cursor, Windsurf, and Antigravity.

```typescript
import { defaultAdapters } from "@iamjarvis/extbridge-core";

for (const adapter of defaultAdapters) {
  const path = await adapter.detectExtensionsPath();
  console.log(`${adapter.name}: ${path}`);
}
```

### 3. **Marketplace Downloads (`fetchExtensionMeta`, `installExtension`)**

Functions to programmatically fetch extension `.vsix` payloads from the public Open VSX marketplace and extract them seamlessly into the shared store.

```typescript
import { fetchExtensionMeta, installExtension } from "@iamjarvis/extbridge-core";

// Get metadata (latest version)
const meta = await fetchExtensionMeta("eamodio.gitlens");

// Download and install directly to the global store directory
await installExtension("eamodio.gitlens", "latest", storeDirPath, registryPath);
```

### 4. **Deduplication Engine (`initializeStore`, `syncRegistryLinks`, `importStoreToIde`)**

The meat of the logic. These commands abstract away traversing file trees, generating SHA-hashes, moving items to the global store, and safely writing cross-platform symlinks back into the IDE folders.

- `initializeStore`: Scans detected IDEs, identifies duplicates, moves them, and creates links.
- `syncRegistryLinks`: Re-evaluates all known IDEs strictly against the `registry.json` and repairs any deleted links.
- `importStoreToIde`: Attaches a single IDE to all known extensions residing in the global store.
