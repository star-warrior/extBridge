/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutDashboard,
  Puzzle,
  Activity,
  RefreshCw,
  ShoppingCart,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Github,
} from "lucide-react";
import logo from "../assets/logo.jpg";

// --- Type definitions matching core's data shapes ---
interface IDEEntry {
  name: string;
  extensionsPath: string;
  detected: boolean;
  usedBy?: string[];
}

interface ExtensionEntry {
  id: string;
  publisher: string;
  name: string;
  version: string;
  storePath: string;
  hash: string;
  usedBy: string[];
  refCount: number;
}

interface RegistryData {
  ides: Record<string, IDEEntry>;
  extensions: Record<string, ExtensionEntry>;
}

interface DoctorIssue {
  type: string;
  severity: "error" | "warning";
  message: string;
  path: string;
  ideId?: string;
  extensionKey?: string;
}

interface DoctorReport {
  issues: DoctorIssue[];
}

interface ExtMeta {
  id: string;
  publisher: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  downloadUrl: string;
}

type Tab = "overview" | "extensions" | "doctor" | "sync" | "marketplace";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IDECard({ id, ide }: { id: string; ide: IDEEntry }) {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        border: "0.5px solid var(--color-gray-200)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex-center" style={{ marginBottom: "var(--space-2)" }}>
        <h3 className="text-section-head">{ide.name}</h3>
        <span
          className={`badge ${ide.detected ? "badge-green" : "badge-gray"}`}
          style={{ marginLeft: "auto" }}
        >
          {ide.detected ? "Detected" : "Not found"}
        </span>
      </div>
      <div className="text-code text-muted">{ide.extensionsPath || "—"}</div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        border: "0.5px solid var(--color-gray-200)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="text-page-title" style={{ color: "var(--color-blue-primary)" }}>
        {value}
      </div>
      <div className="text-section-head">{label}</div>
      {sub && (
        <div className="text-small" style={{ color: "var(--color-gray-500)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ExtensionRow({
  extKey,
  ext,
  ides,
}: {
  extKey: string;
  ext: ExtensionEntry;
  ides: Record<string, IDEEntry>;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderBottom: "0.5px solid var(--color-gray-200)", padding: "var(--space-3) 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-code">{extKey}</span>
        <div className="flex-center">
          <span className="badge badge-gray">v{ext.version}</span>
          <span className="text-small" style={{ color: "var(--color-gray-500)" }}>
            {ext.refCount} IDE{ext.refCount === 1 ? "" : "s"}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-3)",
            background: "var(--color-gray-50)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div className="text-small">
            Store Path: <span className="text-code">{ext.storePath}</span>
          </div>
          <div className="text-small">
            Hash: <span className="text-code">{ext.hash}</span>
          </div>
          <div className="text-small" style={{ marginTop: "var(--space-2)" }}>
            Used by: {ext.usedBy.map((ideId) => ides[ideId]?.name ?? ideId).join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorView() {
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [running, setRunning] = useState(false);

  const runDoctor = async () => {
    setRunning(true);
    try {
      const result = (await (window as any).ipcRenderer.invoke("run-doctor")) as any;
      setReport(result);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="text-section-head">Health Check</h2>
        <p className="text-body" style={{ color: "var(--color-gray-500)" }}>
          Scan for broken links and untracked extensions.
        </p>
      </div>
      <button className="btn btn-primary" onClick={runDoctor} disabled={running}>
        <Activity size={16} /> {running ? "Running..." : "Run Doctor"}
      </button>

      {report && (
        <div style={{ marginTop: "var(--space-6)" }}>
          {report.issues.length === 0 ? (
            <div className="flex-center" style={{ color: "var(--color-success)" }}>
              <CheckCircle2 size={20} />{" "}
              <span className="text-section-head">Everything looks healthy!</span>
            </div>
          ) : (
            <div>
              <p className="text-section-head" style={{ marginBottom: "var(--space-4)" }}>
                {report.issues.length} issue{report.issues.length !== 1 ? "s" : ""} found
              </p>
              {report.issues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    padding: "var(--space-4)",
                    marginBottom: "var(--space-3)",
                    border: "0.5px solid var(--color-gray-200)",
                    borderLeft: `3px solid ${issue.severity === "error" ? "var(--color-danger)" : "var(--color-warning)"}`,
                    background: "var(--color-gray-50)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div className="flex-center" style={{ marginBottom: "var(--space-2)" }}>
                    {issue.severity === "error" ? (
                      <XCircle size={16} color="var(--color-danger)" />
                    ) : (
                      <AlertTriangle size={16} color="var(--color-warning)" />
                    )}
                    <span className="text-section-head" style={{ textTransform: "capitalize" }}>
                      {issue.type.replace(/-/g, " ")}
                    </span>
                    {issue.ideId && <span className="badge badge-gray">{issue.ideId}</span>}
                  </div>
                  <p className="text-body">{issue.message}</p>
                  <div className="text-code" style={{ marginTop: "var(--space-2)" }}>
                    {issue.path}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SyncView({
  logLines,
  onRunSync,
  onRunInit,
  running,
  orphans,
  onFindOrphans,
  onRemoveOrphans,
}: any) {
  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="text-section-head">Sync & Maintenance</h2>
        <p className="text-body" style={{ color: "var(--color-gray-500)" }}>
          Re-initialize the shared store, sync IDE links.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        <div
          style={{
            padding: "var(--space-4)",
            border: "0.5px solid var(--color-gray-200)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-section-head flex-center">
            <RefreshCw size={16} /> Sync Links
          </h3>
          <p
            className="text-body"
            style={{ color: "var(--color-gray-500)", margin: "var(--space-2) 0 var(--space-4)" }}
          >
            Ensure all IDE symlinks point to the correct store entries.
          </p>
          <div className="flex-center">
            <button
              className="btn btn-secondary"
              onClick={() => onRunSync(true)}
              disabled={!!running}
            >
              Dry Run
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onRunSync(false)}
              disabled={!!running}
            >
              Sync Now
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "var(--space-4)",
            border: "0.5px solid var(--color-gray-200)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-section-head flex-center">
            <Download size={16} /> Re-initialize Store
          </h3>
          <p
            className="text-body"
            style={{ color: "var(--color-gray-500)", margin: "var(--space-2) 0 var(--space-4)" }}
          >
            Deduplicate extensions from all detected IDEs into the shared store.
          </p>
          <div className="flex-center">
            <button
              className="btn btn-secondary"
              onClick={() => onRunInit(true)}
              disabled={!!running}
            >
              Dry Run
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onRunInit(false)}
              disabled={!!running}
            >
              Run Init
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "var(--space-4)",
            border: "0.5px solid var(--color-gray-200)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h3 className="text-section-head flex-center">Orphan Cleaner</h3>
          <p
            className="text-body"
            style={{ color: "var(--color-gray-500)", margin: "var(--space-2) 0 var(--space-4)" }}
          >
            Find store entries no longer referenced by any IDE.
          </p>
          <div className="flex-center">
            <button className="btn btn-secondary" onClick={onFindOrphans} disabled={!!running}>
              Scan
            </button>
            {orphans.length > 0 && (
              <button className="btn btn-danger" onClick={onRemoveOrphans} disabled={!!running}>
                Remove {orphans.length}
              </button>
            )}
          </div>
          {orphans.length > 0 && (
            <ul
              style={{
                margin: "var(--space-3) 0 0",
                paddingLeft: "var(--space-4)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
              }}
            >
              {orphans.map((o: string) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketplaceView() {
  const [query, setQuery] = useState("");
  const [meta, setMeta] = useState<ExtMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<string | null>(null);
  const [syncOnInstall, setSyncOnInstall] = useState(true);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setMeta(null);
    setInstallResult(null);
    try {
      const result = (await (window as any).ipcRenderer.invoke("get-extension-meta", {
        id: query.trim(),
      })) as any;
      setMeta(result);
    } catch (e: any) {
      setError(e.message ?? "Extension not found");
    } finally {
      setLoading(false);
    }
  };

  const install = async () => {
    if (!meta) return;
    setInstalling(true);
    setInstallResult(null);
    try {
      const result = (await (window as any).ipcRenderer.invoke("install-extension", {
        id: meta.id,
        version: undefined,
        sync: syncOnInstall,
      })) as any;
      setInstallResult(`Installed ${result.key} to store${syncOnInstall ? " and synced" : ""}.`);
    } catch (e: any) {
      setInstallResult(`Error: ${e.message}`);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 className="text-section-head">Marketplace</h2>
        <p className="text-body" style={{ color: "var(--color-gray-500)" }}>
          Install from Open VSX Registry directly into your shared store.
        </p>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <input
          type="text"
          placeholder="publisher.extension-name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="input input-path"
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={search} disabled={loading}>
          <Search size={16} /> Search
        </button>
      </div>

      {error && (
        <div className="text-body" style={{ color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {meta && (
        <div
          style={{
            padding: "var(--space-4)",
            border: "0.5px solid var(--color-gray-200)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div
            className="flex-center"
            style={{ justifyContent: "space-between", marginBottom: "var(--space-3)" }}
          >
            <div>
              <h3 className="text-section-head">{meta.displayName || meta.id}</h3>
              <p className="text-code" style={{ color: "var(--color-gray-500)" }}>
                {meta.id} — v{meta.version}
              </p>
            </div>
            <span className="badge badge-gray">{meta.publisher}</span>
          </div>
          {meta.description && (
            <p className="text-body" style={{ marginBottom: "var(--space-4)" }}>
              {meta.description}
            </p>
          )}

          <label className="checkbox-label" style={{ marginBottom: "var(--space-4)" }}>
            <input
              type="checkbox"
              checked={syncOnInstall}
              onChange={(e) => setSyncOnInstall(e.target.checked)}
            />
            Auto-sync to all detected IDEs after install
          </label>

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={install}
            disabled={installing}
          >
            <Download size={16} /> {installing ? "Installing..." : "Install to Store"}
          </button>

          {installResult && (
            <div
              className="text-body"
              style={{
                marginTop: "var(--space-3)",
                color: installResult.startsWith("Error")
                  ? "var(--color-danger)"
                  : "var(--color-success)",
              }}
            >
              {installResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App Shell (OMS Design System Compliant)
// ---------------------------------------------------------------------------

export default function App() {
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [extSearch, setExtSearch] = useState("");

  // Log Drawer state
  const [logCollapsed, setLogCollapsed] = useState(true);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  // Sync state
  const [running, setRunning] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setSyncLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    // Auto-open drawer on new log
    setLogCollapsed(false);
  }, []);

  useEffect(() => {
    const unsub = (window as any).ipcRenderer.on("sync-progress", (event: any, msg: string) => {
      addLog(msg);
    });
    return () => unsub();
  }, [addLog]);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await (window as any).ipcRenderer.invoke("get-status")) as any;
      setRegistry(data);
    } catch (err) {
      console.error("Failed to load registry:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const runInit = async (dryRun: boolean) => {
    setRunning("init");
    addLog(`Running init (dryRun=${dryRun})...`);
    try {
      const report = await (window as any).ipcRenderer.invoke("run-init", {
        dryRun,
        conflict: "keep-both",
      });
      addLog(
        `Init complete. Detected IDEs: ${report.detectedIDEs.length}, Moved: ${report.movedNew}`,
      );
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setRunning(null);
      loadRegistry();
    }
  };

  const runSync = async (dryRun: boolean) => {
    setRunning("sync");
    addLog(`Running sync (dryRun=${dryRun})...`);
    try {
      const report = await (window as any).ipcRenderer.invoke("run-sync", {
        dryRun,
        conflict: "keep-both",
      });
      addLog(`Sync complete. Repaired: ${report.repaired}`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setRunning(null);
      loadRegistry();
    }
  };

  const findOrphans = async () => {
    setRunning("orphans");
    addLog("Searching for orphaned extensions...");
    try {
      const result: string[] = (await (window as any).ipcRenderer.invoke("find-orphans")) as any;
      setOrphans(result);
      addLog(`Found ${result.length} orphan(s).`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setRunning(null);
    }
  };

  const removeOrphans = async () => {
    setRunning("rm-orphans");
    addLog(`Removing ${orphans.length} orphan(s)...`);
    try {
      await (window as any).ipcRenderer.invoke("remove-orphans", { folders: orphans });
      addLog("Orphans removed.");
      setOrphans([]);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    } finally {
      setRunning(null);
      loadRegistry();
    }
  };

  const ides = registry?.ides ?? {};
  const extensions = registry?.extensions ?? {};
  const detectedCount = Object.values(ides).filter((i) => i.detected).length;
  const totalExt = Object.keys(extensions).length;
  const sharedExt = Object.values(extensions).filter((e) => e.refCount > 1).length;
  const extSaved = Object.values(extensions).reduce(
    (acc, e) => acc + Math.max(0, e.refCount - 1),
    0,
  );

  const filteredExts = Object.entries(extensions).filter(
    ([key]) => !extSearch || key.toLowerCase().includes(extSearch.toLowerCase()),
  );

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    { id: "extensions", label: "Extensions", icon: <Puzzle size={16} /> },
    { id: "doctor", label: "Doctor", icon: <ShieldCheck size={16} /> },
    { id: "sync", label: "Sync", icon: <RefreshCw size={16} /> },
    { id: "marketplace", label: "Marketplace", icon: <ShoppingCart size={16} /> },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo-mark">
            <img src={logo} className="logo-img" alt="Logo" />
          </div>
          <span className="text-page-title">ExtBridge</span>
        </div>
        <div className="topbar-right">
          <a
            href="https://github.com/star-warrior/extBridge"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            <Github size={16} /> Contribute on Github
          </a>
        </div>
      </header>

      <div className="body">
        <main className="main">
          <div className="tab-bar-wrapper">
            <div className="tab-bar">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </div>
              ))}
            </div>
          </div>

          <div className="split-panels">
            <div className="editor-panel" style={{ flex: 1, borderRight: "none" }}>
              {loading && activeTab === "overview" ? (
                <div className="empty-state">
                  <RefreshCw
                    size={24}
                    className="spin"
                    style={{ marginBottom: "var(--space-4)" }}
                  />
                  <p>Loading application state...</p>
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                      <div
                        className="flex-center"
                        style={{ gap: "var(--space-4)", marginBottom: "var(--space-8)" }}
                      >
                        <StatCard
                          label="Detected IDEs"
                          value={detectedCount}
                          sub={`of ${Object.keys(ides).length} supported`}
                        />
                        <StatCard
                          label="Shared Extensions"
                          value={totalExt}
                          sub={`${sharedExt} shared across IDEs`}
                        />
                        <StatCard
                          label="Duplicate Saves"
                          value={extSaved}
                          sub="extension copies avoided"
                        />
                      </div>

                      <h3 className="text-section-head" style={{ marginBottom: "var(--space-4)" }}>
                        IDE Status
                      </h3>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                          gap: "var(--space-4)",
                        }}
                      >
                        {Object.entries(ides).map(([id, ide]) => (
                          <IDECard key={id} id={id} ide={ide} />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "extensions" && (
                    <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Filter by extension key..."
                        value={extSearch}
                        onChange={(e) => setExtSearch(e.target.value)}
                        style={{ marginBottom: "var(--space-6)" }}
                      />
                      {filteredExts.length === 0 ? (
                        <div className="empty-state">No extensions match your search.</div>
                      ) : (
                        filteredExts.map(([key, ext]) => (
                          <ExtensionRow key={key} extKey={key} ext={ext} ides={ides} />
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "doctor" && (
                    <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                      <DoctorView />
                    </div>
                  )}

                  {activeTab === "sync" && (
                    <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                      <SyncView
                        logLines={syncLog}
                        onRunSync={runSync}
                        onRunInit={runInit}
                        running={running}
                        orphans={orphans}
                        onFindOrphans={findOrphans}
                        onRemoveOrphans={removeOrphans}
                      />
                    </div>
                  )}

                  {activeTab === "marketplace" && (
                    <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                      <MarketplaceView />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`log-drawer ${logCollapsed ? "collapsed" : ""}`}>
            <div className="log-drawer-header" onClick={() => setLogCollapsed(!logCollapsed)}>
              <div className="log-drawer-controls">
                <span className="text-overline" style={{ color: "var(--color-gray-500)" }}>
                  Activity Log (stdout & stderr)
                </span>
                <button
                  className="btn btn-icon-only btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSyncLog([]);
                  }}
                >
                  Clear
                </button>
              </div>
              {logCollapsed ? (
                <ChevronUp size={16} color="var(--color-gray-400)" />
              ) : (
                <ChevronDown size={16} color="var(--color-gray-400)" />
              )}
            </div>
            <div className="log-console" role="log" aria-live="polite">
              {syncLog.length === 0 ? (
                <div className="log-muted">No logs recorded yet.</div>
              ) : (
                syncLog.map((line, i) => (
                  <div
                    key={i}
                    className={line.toLowerCase().includes("error") ? "log-error" : "log-info"}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
