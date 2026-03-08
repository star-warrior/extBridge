# @iamjarvis/extbridge-core

**The core algorithmic engine and shared registry logic for ExtBridge.**

ExtBridge is a tool designed to deduplicate VS Code (and compatible IDE) extensions across multiple IDE installations (like Cursor, Windsurf, VSCodium, etc.), significantly reducing disk space usage and keeping extensions globally synchronized.

This package (`@iamjarvis/extbridge-core`) contains the core logic for:

- 🗃️ Parsing and validating the central registry (`~/.extbridge/registry.json`).
- 🔑 Hash-based deduplication (SHA-256) of IDE extension folders.
- 🔌 IDE Adapters (detecting extension paths for various VS Code forks).
- 🔄 Safely linking, syncing, and modifying IDE extension directories.
- 🌐 Connecting to the Open VSX registry to fetch and download `.vsix` data.

## 📖 Comprehensive Documentation

This README is just a brief overview for the NPM registry.

For detailed API documentation, architecture explanations, and integration guides on how to use `extbridge-core` in your own Node.js applications, please see the **[Detailed Core Documentation on GitHub](https://github.com/star-warrior/extBridge/blob/main/documentation/core.md)**.

## 🚀 Looking for the CLI App?

If you are a regular user trying to use ExtBridge to deduplicate your IDEs through your terminal, you are looking for the CLI package!

👉 **[Go to @iamjarvis/extbridge-cli](https://www.npmjs.com/package/@iamjarvis/extbridge-cli)**

## 🤝 Contributing

Please see the [GitHub Repository](https://github.com/star-warrior/extBridge) for issues, pull requests, and contribution guidelines.
