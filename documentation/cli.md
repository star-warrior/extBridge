# ExtBridge CLI Documentation

The `@iamjarvis/extbridge-cli` application is the primary interface for users to safely manage and synchronize their multi-IDE environments.

## 🚀 Installation & Invocation

You can run commands implicitly using `npx`:

```bash
npx @iamjarvis/extbridge-cli <command>
```

Or globally:

```bash
npm install -g @iamjarvis/extbridge-cli
extbridge <command>
```

---

## 🛠️ Command Reference

### `status`

Displays a comprehensive report of the host environment.

- Detects known IDEs (VS Code, Cursor, Windsurf, VSCodium, Antigravity).
- Counts extensions across IDEs.
- Calculates and visualizes the total estimated disk space saved via deduplication.

**Usage:** `extbridge status`

---

### `init`

The primary bootstrap command. `init` scans all detected IDE extensions, deduplicates identical extensions utilizing SHA-256 hashing, creates a central store located at `~/.extbridge/store`, and replaces the original ide extensions with symlinks (Unix) or junctions (Windows).

**Usage:** `extbridge init`
**Dry Run:** `extbridge init --dry-run` (Recommended for first time usage to observe exactly what files will be targeted).

---

### `sync`

The sync command assumes the registry `~/.extbridge/registry.json` is the sole source of truth. It verifies all known IDEs against the registry and completely repairs any missing or corrupted symbolic links.

**Usage:** `extbridge sync`
**Dry Run:** `extbridge sync --dry-run`

---

### `add-ide <id> [extensionsPath]`

Registers a new IDE to be continuously tracked by ExtBridge's registry synchronization.

**Standard VS Code derivatives:**

```bash
extbridge add-ide cursor
```

**Custom IDE installations:**

```bash
extbridge add-ide customId "/home/user/.custom-ide/extensions" --name "My Custom IDE"
```

---

### `import-ide <id>`

Forces a specified and registered IDE to adopt every single extension currently housed in the `~/.extbridge/store`. This is extremely useful when bootstrapping a brand new IDE (like installing Cursor for the first time) and instantly linking all your existing VS Code extensions.

**Usage:** `extbridge import-ide cursor`
**Dry Run:** `extbridge import-ide cursor --dry-run`

---

### `add <extension-id>`

Instantly pulls and downloads an extension from the public Open VSX marketplace directly into your ExtBridge shared pool, bypassing the IDE entirely. Once it's downloaded into the pool, it will automatically symlink and sync into all your connected IDEs.

**Usage:** `extbridge add eamodio.gitlens`
**Specify a Version:** `extbridge add eamodio.gitlens --version 15.0.0`
