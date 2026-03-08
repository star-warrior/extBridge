# Contributing to ExtBridge

Thanks for contributing to ExtBridge.

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
3. Install dependencies (Husky will initialize automatically):
   ```bash
   corepack pnpm install
   ```
4. Build, test, and format code:
   ```bash
   npm run build
   npm run test
   npm run format
   ```

## Workspace Layout

- `packages/core`: shared business logic (adapters, registry, dedup, sync, status)
- `packages/cli`: command-line interface

## Coding Guidelines

- Use TypeScript with strict typing.
- Keep modules small and purpose-specific.
- Favor explicit errors over silent failures.
- Preserve cross-platform behavior (Windows + Unix-like).
- Use ASCII unless the file already requires Unicode.
- Add concise comments only when logic is non-obvious.

## Safety Guidelines

ExtBridge modifies extension directory entries. Follow these rules:

- Do not introduce destructive behavior without a dry-run path.
- Ensure file operations are deliberate and recoverable.
- Do not silently remove user data.
- Maintain or improve current safety behavior for `init` and `sync`.

## Testing

- Add or update tests for behavior changes in `packages/core`.
- Keep tests deterministic and isolated (use temporary directories).
- Ensure all tests pass before creating a PR:
  ```bash
  npm run test
  ```

## Pull Request Checklist

- [ ] Build passes (`npm run build`)
- [ ] Tests and typechecks pass (`npm run test`, `npm run typecheck`)
- [ ] Linter returns no warnings (`npm run lint`)
- [ ] Documentation updated for user-facing changes
- [ ] Changes are scoped and explained in the PR description
- [ ] Backward compatibility and migration impact considered

## Commit Message Guidance

Use clear, imperative commit subjects, for example:

- `core: fix symlink repair for missing store entries`
- `cli: add dry-run output for sync`
- `docs: document phase 1 command behavior`

## Reporting Issues

- Bug reports: include OS, Node version, command run, expected result, and actual result.
- Feature requests: explain use case, constraints, and proposed behavior.

## Security Reports

Do not open public issues for sensitive vulnerabilities.
See `SECURITY.md` for private disclosure guidance.
