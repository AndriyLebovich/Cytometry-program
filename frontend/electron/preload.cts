import type { AnalysisRequest, AnalysisResponse } from '../src/analysisContract.js';
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
   analyzeFcs: (request: AnalysisRequest): Promise<AnalysisResponse> =>
      ipcRenderer.invoke("analyze-fcs", request),
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