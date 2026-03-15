# Security Policy

## Supported Versions

This project is in active early development. The latest `main` branch is the only
supported version for security fixes at this time.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately.

Include:

- A clear description of the issue
- Affected files/components
- Reproduction steps or proof of concept
- Potential impact
- Suggested remediation (if known)

Please do not disclose vulnerabilities publicly until a fix is available.

## Response Process

- Acknowledgement target: within 5 business days
- Triage and impact assessment
- Fix development and validation
- Coordinated disclosure after patch release

## Security Focus Areas for ExtBridge

Given ExtBridge manages local filesystem links and provides a Desktop GUI, key review areas include:

### Core & CLI

- Symlink/junction target validation
- Path traversal prevention
- Unsafe delete or overwrite operations
- Privilege-sensitive behavior on Windows junctions
- Registry integrity and tamper handling

### Desktop GUI (Electron)

- **Context Isolation & Node Integration**: The GUI must use preload scripts with context isolation enabled. `nodeIntegration` must be strictly disabled for the renderer process.
- **IPC Validation**: All IPC communication between the Renderer (React) and the Main Process (Node.js) should be strictly typed and sanitized.
- **XSS Prevention**: Ensure user input and paths are properly escaped in the React renderer.

## Best Practices for Users

- Use `extbridge init --dry-run` before first-time migrations on important environments.
- Keep backups of IDE extension directories before large migrations.
- Run `extbridge doctor` to verify system integrity.
