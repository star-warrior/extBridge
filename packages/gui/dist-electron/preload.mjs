import { contextBridge as e, ipcRenderer as t } from "electron";
//#region electron/preload.ts
e.exposeInMainWorld("ipcRenderer", {
	on(e, n) {
		let r = (e, ...t) => n(e, ...t);
		return t.on(e, r), () => {
			t.removeListener(e, r);
		};
	},
	send(...e) {
		return t.send(...e);
	},
	invoke(...e) {
		return t.invoke(...e);
	}
});
//#endregion
