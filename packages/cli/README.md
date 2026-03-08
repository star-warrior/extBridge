# @iamjarvis/extbridge-cli

**The official command-line interface for ExtBridge: Cross-IDE Extension Deduplication.**

ExtBridge is a powerful utility designed to deduplicate VS Code extensions across multiple compatible IDE installations (such as Cursor, Windsurf, VSCodium, and Antigravity). It significantly reduces massive disk space usage while keeping all your extensions functionally synchronized globally.

This package (`@iamjarvis/extbridge-cli`) provides the terminal commands needed to initialize the store, monitor IDE statuses, safely link extensions, and seamlessly download new extensions from Open VSX directly into your synchronized pool.

## 🚀 Quick Start

Run ExtBridge instantly without installing:

```bash
npx @iamjarvis/extbridge-cli status
```

Or install it globally for convenience:

```bash
npm install -g @iamjarvis/extbridge-cli
```

```bash
extbridge init
```

## 📖 Comprehensive Documentation

This README is a brief overview for the NPM registry.

For detailed explanations of every CLI command, advanced configurations, and registry mechanics, please see the **[Detailed CLI Documentation on GitHub](https://github.com/star-warrior/extBridge/blob/main/documentation/cli.md)**.

## 🏗️ Looking for the Core Node.js Engine?

If you are a developer aiming to programmatically use the extension deduplication and open-vsx download algorithms inside your own node applications, try our core library instead!

👉 **[Go to @iamjarvis/extbridge-core](https://www.npmjs.com/package/@iamjarvis/extbridge-core)**

## 🤝 Contributing

Please see the [GitHub Repository](https://github.com/star-warrior/extBridge) for issues, pull requests, and contribution guidelines.
