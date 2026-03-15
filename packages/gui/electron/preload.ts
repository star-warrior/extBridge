/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextBridge, ipcRenderer } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(channel: string, listener: (...args: any[]) => void) {
    const subscription = (event: Electron.IpcRendererEvent, ...args: any[]) =>
      listener(event, ...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    return ipcRenderer.send(...args);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    return ipcRenderer.invoke(...args);
  },
});
