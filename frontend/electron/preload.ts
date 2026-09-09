import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
   runPython: () => ipcRenderer.invoke("run-python"),
});