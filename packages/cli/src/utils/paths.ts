import os from "node:os";
import path from "node:path";

export const extBridgeRoot = path.join(os.homedir(), ".extbridge");
export const storeDir = path.join(extBridgeRoot, "store");
export const registryPath = path.join(extBridgeRoot, "registry.json");
