const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
   runPython: (command: string) => ipcRenderer.invoke("run-python", command),
});