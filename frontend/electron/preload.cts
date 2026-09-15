const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
   runPython: (
   command: string,
   data?: unknown
   ): Promise<string> =>
   ipcRenderer.invoke("run-python", {
      command,
      data,
   }),

   selectFcsFile: (): Promise<string | null> =>
      ipcRenderer.invoke("select-fcs-file"),
});