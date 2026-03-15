import { Registry, runDoctor, type DoctorIssue } from "@iamjarvis/extbridge-core";
import { registryPath } from "../utils/paths.js";

/**
 * CLI command to run health checks and report issues.
 */
export async function doctorCommand(): Promise<void> {
  const registry = new Registry(registryPath);
  await registry.load();

  console.log("🏥 Running ExtBridge Health Check...");

  const report = await runDoctor(registry);

  if (report.issues.length === 0) {
    console.log("✅ No issues found. Your system is in good health!");
    return;
  }

  const errors = report.issues.filter((i: DoctorIssue) => i.severity === "error");
  const warnings = report.issues.filter((i: DoctorIssue) => i.severity === "warning");

  console.log(
    `Found ${report.issues.length} issue(s) (${errors.length} error(s), ${warnings.length} warning(s)):\n`,
  );

  for (const issue of report.issues) {
    const symbol = issue.severity === "error" ? "❌" : "⚠️";
    const label = issue.severity.toUpperCase();
    console.log(`${symbol} [${label}] ${issue.message}`);
    console.log(`   Path: ${issue.path}`);
    console.log(""); // Spacing
  }

  if (errors.length > 0) {
    console.log("💡 Tip: Try running 'extbridge sync' to repair broken or missing IDE links.");
  }
}
