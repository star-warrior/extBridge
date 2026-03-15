#!/usr/bin/env node
import { Command } from "commander";
import { type ConflictStrategy } from "@iamjarvis/extbridge-core";
import { addCommand } from "./commands/add.js";
import { addIdeCommand } from "./commands/add-ide.js";
import { initCommand } from "./commands/init.js";
import { importIdeCommand } from "./commands/import-ide.js";
import { statusCommand } from "./commands/status.js";
import { syncCommand } from "./commands/sync.js";
import { doctorCommand } from "./commands/doctor.js";
import { cleanCommand } from "./commands/clean.js";
import { watchCommand } from "./commands/watch.js";

async function main(): Promise<void> {
  const program = new Command();

  program.name("extbridge").description("Cross-IDE extension deduplication").version("0.1.0");

  program
    .command("add <id>")
    .description("Download an extension from Open VSX and add it to the shared store")
    .option("--version <version>", "specific version to install (defaults to latest)")
    .option("--no-sync", "add to store only, do not sync to IDEs")
    .option("--dry-run", "print what would happen without modifying files")
    .action(
      async (id: string, options: { version?: string; noSync?: boolean; dryRun?: boolean }) => {
        await addCommand(id, options);
      },
    );

  program
    .command("init")
    .description("Scan detected IDEs and deduplicate extensions into shared store")
    .option("--dry-run", "print actions without modifying files")
    .option(
      "--conflict <strategy>",
      "conflict resolution strategy (keep-both, latest-wins)",
      "keep-both",
    )
    .action(async (options: { dryRun?: boolean; conflict: ConflictStrategy }) => {
      await initCommand(options);
    });

  program
    .command("status")
    .description("Show detected IDEs, shared extensions, and estimated disk savings")
    .action(async () => {
      await statusCommand();
    });

  program
    .command("sync")
    .description("Recreate missing or broken links based on the registry")
    .option("--dry-run", "print actions without modifying files")
    .option(
      "--conflict <strategy>",
      "conflict resolution strategy (keep-both, latest-wins)",
      "keep-both",
    )
    .action(async (options: { dryRun?: boolean; conflict: ConflictStrategy }) => {
      await syncCommand(options);
    });

  program
    .command("add-ide <id> [extensionsPath]")
    .description("Register an IDE; auto-detect extensions path when omitted")
    .option("--name <name>", "display name for the custom IDE")
    .action(async (id: string, extensionsPath: string | undefined, options: { name?: string }) => {
      await addIdeCommand(id, extensionsPath, options);
    });

  program
    .command("import-ide <id>")
    .description("Import all shared store extensions into a registered IDE")
    .option("--dry-run", "print actions without modifying files")
    .action(async (id: string, options: { dryRun?: boolean }) => {
      await importIdeCommand(id, options);
    });

  program
    .command("doctor")
    .description("Run health checks to detect broken links or missing extensions")
    .action(async () => {
      await doctorCommand();
    });

  program
    .command("clean")
    .description("Remove orphaned extension folders from the shared store")
    .option("--dry-run", "print actions without modifying files")
    .option("--force", "actually remove the orphaned folders")
    .action(async (options: { dryRun?: boolean; force?: boolean }) => {
      await cleanCommand(options);
    });

  program
    .command("watch")
    .description("Start a background watcher to automatically deduplicate extensions")
    .option(
      "--conflict <strategy>",
      "conflict resolution strategy (keep-both, latest-wins)",
      "keep-both",
    )
    .action(async (options: { conflict: ConflictStrategy }) => {
      await watchCommand(options);
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
