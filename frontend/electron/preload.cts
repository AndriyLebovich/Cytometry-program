const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
   runPython: (
   command: string,
   data?: unknown
   ): Promise<unknown> =>
   ipcRenderer.invoke("run-python", {
      command,
      data,
   }),

   selectFcsFile: (): Promise<string | null> =>
      ipcRenderer.invoke("select-fcs-file"),
});