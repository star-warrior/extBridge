# 🌉 ExtBridge

![GitHub CI](https://img.shields.io/github/actions/workflow/status/Jay/extbridge/ci.yml?branch=main&label=CI&logo=github)
![Node Version](https://img.shields.io/node/v/extbridge?logo=node.js)
![PNPM](https://img.shields.io/badge/pnpm-10.6.0-orange?logo=pnpm)
![License](https://img.shields.io/badge/license-GPLv3-blue.svg)

**ExtBridge** is a cross-IDE extension deduplication tool for VS Code-compatible editors.
It keeps one shared local copy of each extension and links IDE-specific extension folders to that shared store.

## 🤔 Why ExtBridge?

Developers often use multiple VS Code-based IDEs (for example VS Code, Cursor, Windsurf, VSCodium, and Antigravity). Each IDE stores extension files independently, which causes:

- 💾 Duplicate disk usage
- 🕒 Version drift between IDEs
- 🔄 Repeated reinstall/setup work

ExtBridge solves this by centralizing extension storage in a single local location and linking each IDE to it.

## 🌟 Current Scope (Phase 1)

**Implemented now:**

- 📦 Monorepo structure with `@extbridge/core` and `@extbridge/cli`
- 🔌 IDE adapters for: **VS Code**, **Antigravity**, **Cursor**, **Windsurf**, **VSCodium**
- 🗃️ Central registry (`~/.extbridge/registry.json`) with Zod validation
- 🔑 Hash-based deduplication (SHA-256 of extension folders)
- 🔗 Cross-platform directory linking (Symlinks on Unix, Junctions on Windows)
- 🛠️ CLI commands to manage state
- 📥 Direct extension downloads from the Open VSX Marketplace
- ✅ Unit tests (hashing and registry persistence)

**Not yet implemented in this phase:**

- 👁️ Background watcher daemon
- ⚔️ Conflict resolution strategies (`keep-both`, `latest-wins`, `ask`)
- 🩺 `doctor`, `clean`, and `install` commands
- 🖥️ GUI

## 📁 Project Structure

```text
extbridge/
├── packages/
│   ├── core/           # Core deduplication, registry, and adapters logic
│   └── cli/            # ExtBridge CLI implementation (`extbridge <command>`)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## ⚙️ Requirements

- **Node.js**: 20+
- **Corepack**: enabled (recommended)

If needed, enable corepack:

```bash
corepack enable
```

## 🚀 Getting Started

You can run ExtBridge instantly using `npx`, or install it globally for convenience.

**Run instantly via npx:**

```bash
npx @extbridge/cli <command>
```

**Install globally:**

```bash
npm install -g @extbridge/cli
```

## 🛠️ CLI Usage

_If you installed ExtBridge globally, you can just use `extbridge <command>`. Otherwise, prefix these with `npx @extbridge/cli`._

### 📊 `status`

Shows detected IDEs, extension folder counts, shared extensions, and estimated disk savings.

```bash
extbridge status
```

### ✨ `init`

Scans detected IDE extension directories, deduplicates extension content into `~/.extbridge/store`, and links IDE entries to the shared store.

```bash
extbridge init
```

_Dry-run mode:_ `extbridge init --dry-run`

### 🔄 `sync`

Repairs missing or broken links based on `~/.extbridge/registry.json`.

```bash
extbridge sync
```

_Dry-run mode:_ `extbridge sync --dry-run`

### ➕ `add-ide`

Registers a custom IDE extension directory so it participates in `status`, `init`, and `sync` workflows.

If ExtBridge knows the IDE (or can infer it), you can pass only the IDE id/name:

```bash
extbridge add-ide antigravity
```

Custom extension directory:

```bash
extbridge add-ide myide "/path/to/extensions"
```

Optional display name:

```bash
extbridge add-ide myide "/path/to/extensions" --name "My IDE"
```

### 📥 `import-ide`

Imports all extensions currently stored in `~/.extbridge/store` into a registered IDE by creating links and updating registry ownership.

```bash
extbridge import-ide myide
```

_Dry-run mode:_ `extbridge import-ide myide --dry-run`

**Typical flow for a new IDE:**

```bash
extbridge add-ide myide "/path/to/extensions" --name "My IDE"
extbridge import-ide myide
```

### 🌐 `add`

Downloads an extension from the Open VSX marketplace and adds it to the ExtBridge store. It automatically syncs the newly downloaded extension to all detected IDEs.

```bash
extbridge add <extension-id>
```

_Example:_ `... add eamodio.gitlens`

Optional flags:

- `--version <version>` : Download a specific version of the extension
- `--no-sync` : Download to the store but do not sync links to local IDEs
- `--dry-run` : Resolve extension metadata without downloading or syncing

## 🏗️ CI Compatibility Matrix

GitHub Actions CI runs on:

- 🐧 Linux (`ubuntu-latest`)
- 🪟 Windows (`windows-latest`)
- 🍏 macOS (`macos-latest`)

The workflow validates install, build, tests, and CLI smoke commands on each OS.

## 📂 Storage Layout

ExtBridge uses the following local files/directories:

```text
~/.extbridge/
├── store/
└── registry.json
```

## ⚠️ Safety Notes

- Start with `--dry-run` before `init` on machines with important local setups.
- Review extension state with `status` before and after migration.
- Keep backups for critical development environments while the project is evolving.

## 💻 Development

```bash
# typecheck all packages
npm run typecheck

# build
npm run build

# test
npm run test
```

## 🪝 Git Hooks & Workflow

This repository uses **Husky** to automate checks and maintain code quality across the team. We use a structured, multi-stage validation workflow:

1. **Pre-commit Hook (Fast checks)**:
   - Linting is performed precisely on updated files via `lint-staged`.
   - Code is automatically formatted by `prettier --write`.
2. **Commit-msg Hook**:
   - Commit messages are enforced to follow the [Conventional Commits](https://www.conventionalcommits.org/) standard via `commitlint`.
3. **Pre-push Hook (Heavy checks)**:
   - Before any code leaves your machine, the full automated test suite runs (`pnpm test`).
   - TypeScript compiles strictly to catch all types issues (`pnpm typecheck`).
4. **Continuous Integration (CI)**:
   - GitHub Actions validates tests and builds across Linux, Windows, and macOS simultaneously.

_Note: If you are in an extreme emergency and need to bypass local hooks, add `--no-verify` to your git command. However, GitHub Actions CI will serve as the ultimate source of truth._

## 🤝 Contributing

See `CONTRIBUTING.md` for development workflow, coding standards, and pull request guidance.

## 🔐 Security

See `SECURITY.md` for vulnerability reporting instructions.

## 📝 License

This project is licensed under the GNU General Public License v3.0.
See `LICENSE` for details.
