import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchExtensionMeta, installExtension } from "../src/install.js";
import { Registry } from "../src/registry/registry.js";

// ---------------------------------------------------------------------------
// Mock global fetch so the tests never hit the network
// ---------------------------------------------------------------------------

const MOCK_META_RESPONSE = {
  namespace: "eamodio",
  name: "gitlens",
  version: "16.0.0",
  targetPlatform: "universal",
  files: {
    download: "https://open-vsx.org/api/eamodio/gitlens/16.0.0/file/eamodio.gitlens-16.0.0.vsix",
  },
};

// We'll inject a tiny fake VSIX (ZIP) for extraction tests.
// Rather than building a real ZIP in the test, we mock downloadAndExtract
// by replacing the fetch response body.

describe("fetchExtensionMeta", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_META_RESPONSE,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses namespace, name, version and downloadUrl from Open VSX response", async () => {
    const meta = await fetchExtensionMeta("eamodio.gitlens");

    expect(meta.namespace).toBe("eamodio");
    expect(meta.name).toBe("gitlens");
    expect(meta.version).toBe("16.0.0");
    expect(meta.downloadUrl).toBe(MOCK_META_RESPONSE.files.download);
  });

  it("builds the correct folder name including the platform suffix", async () => {
    const meta = await fetchExtensionMeta("eamodio.gitlens");
    expect(meta.folderName).toBe("eamodio.gitlens-16.0.0-universal");
  });

  it("throws a clear error when the extension is not found (404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );

    await expect(fetchExtensionMeta("nobody.nonexistent")).rejects.toThrow(
      /not found on Open VSX/i,
    );
  });

  it("throws when extensionId has no dot separator", async () => {
    await expect(fetchExtensionMeta("badsingleword")).rejects.toThrow(/Invalid extension ID/i);
  });

  it("passes the version to the API URL when specified", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...MOCK_META_RESPONSE, version: "15.0.0" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const meta = await fetchExtensionMeta("eamodio.gitlens", "15.0.0");

    expect(meta.version).toBe("15.0.0");
    const calledUrl = (fetchMock.mock.calls[0] as [string])[0];
    expect(calledUrl).toContain("/15.0.0");
  });
});

describe("installExtension — dry-run", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => MOCK_META_RESPONSE,
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the expected key and storePath without writing any files", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "extbridge-install-test-"));
    const registryFile = path.join(tmpDir, "registry.json");
    const registry = new Registry(registryFile);
    await registry.load();

    const storeDir = path.join(tmpDir, "store");

    const result = await installExtension("eamodio.gitlens", storeDir, registry, undefined, true);

    expect(result.key).toBe("eamodio.gitlens-16.0.0-universal");
    expect(result.storePath).toBe(path.join(storeDir, "eamodio.gitlens-16.0.0-universal"));
    expect(result.alreadyInstalled).toBe(false);

    // Dry-run: store directory must NOT have been created
    await expect(fs.access(storeDir)).rejects.toThrow();

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
