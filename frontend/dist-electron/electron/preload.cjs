"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
    runPython: (command, data) => ipcRenderer.invoke("run-python", {
        command,
        data,
    }),
});
