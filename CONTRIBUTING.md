# Contributing to ExtBridge

Thanks for contributing to ExtBridge!

## Before You Start

- Read `README.md` for project goals and current implementation status.
- Search existing issues/PRs before opening new ones.
- Keep changes focused and scoped to a single concern where possible.

## Development Setup

1. Install Node.js 20+.
2. Enable Corepack:
   ```bash
   corepack enable
   ```
3. Install dependencies:
   ```bash
   corepack pnpm install
   ```
4. Build, test, and format code:
   ```bash
   npm run build
   # Run core tests
   npm run test
   ```

## Workspace Layout

- `packages/core`: shared business logic (adapters, registry, dedup, sync, doctor, watch)
- `packages/cli`: command-line interface
- `packages/gui`: Desktop GUI built with Electron, React, Vite, and tailwindcss.

## Coding Guidelines

- Use TypeScript with strict typing.
- Keep modules small and purpose-specific.
- Favor explicit errors over silent failures.
- Preserve cross-platform behavior (Windows + Unix-like).
- For the GUI: ensure React components are strictly typed and use Tailwind for UI styling following the `kit/DESIGN_KIT.md`.

## GUI Development & Testing

When developing the GUI in `packages/gui`:

1. Start the dev server:
   ```bash
   pnpm --filter @iamjarvis/extbridge-gui run dev
   ```
2. Run E2E Playwright tests to ensure Cross-Platform compatibility:
   ```bash
   pnpm --filter @iamjarvis/extbridge-gui exec playwright test
   ```

ExtBridge's CI will enforce Playwright E2E tests before merges on Linux, Windows, and macOS.

## Safety Guidelines

ExtBridge modifies extension directory entries. Follow these rules:

- Do not introduce destructive behavior without a dry-run path.
- Ensure file operations are deliberate and recoverable.
- Maintain or improve current safety behavior for `init`, `sync`, `clean`, and `doctor`.

## Pull Request Checklist

- [ ] Build passes (`npm run build`)
- [ ] Core tests and typechecks pass (`npm run test`, `npm run typecheck`)
- [ ] GUI E2E tests pass (`playwright test`)
- [ ] Documentation updated for user-facing changes (README.md, CLI docs, GUI docs)
- [ ] Backward compatibility and migration impact considered

## Commit Message Guidance

Use clear, imperative commit subjects, for example:

- `core: fix symlink repair for missing store entries`
- `cli: add doctor command`
- `gui: implement dark mode toggle`
- `docs: update GUI setup instructions`

## Reporting Issues

- Bug reports: include OS, Node version, command run (or GUI screen), expected result, and actual result.

## Security Reports

Do not open public issues for sensitive vulnerabilities.
See `SECURITY.md` for private disclosure guidance.
