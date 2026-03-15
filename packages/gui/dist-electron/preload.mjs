import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(channel, listener) {
    const subscription = (event, ...args) => listener(event, ...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  send(...args) {
    return ipcRenderer.send(...args);
  },
  invoke(...args) {
    return ipcRenderer.invoke(...args);
  },
});
//#endregion
