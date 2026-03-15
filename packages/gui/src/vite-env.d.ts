/// <reference types="vite/client" />

declare module "*.jpg" {
  const src: string;
  export default src;
}

interface Window {
  ipcRenderer: import("electron").IpcRenderer;
}
