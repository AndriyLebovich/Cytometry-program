"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
    analyzeFcs: (request) => ipcRenderer.invoke("analyze-fcs", request),
    runPython: (command, data) => ipcRenderer.invoke("run-python", {
        command,
        data,
    }),
    selectFcsFile: () => ipcRenderer.invoke("select-fcs-file"),
});
