import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.cjs"),
        },
    });
    win.loadURL("http://localhost:5173");
}
ipcMain.handle("select-fcs-file", async () => {
    console.log("SELECT FCS FILE HANDLER CALLED");
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
            {
                name: "FCS files",
                extensions: ["fcs"],
            },
        ],
    });
    if (result.canceled || result.filePaths.length === 0) {
        console.log("FILE SELECTION CANCELLED");
        return null;
    }
    console.log("SELECTED FILE:", result.filePaths[0]);
    return result.filePaths[0];
});
ipcMain.handle("run-python", (_, request) => {
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(__dirname, "../../../venv/Scripts/python.exe");
        const pythonProcess = spawn(pythonPath, [
            path.join(__dirname, "../../../backend/main.py"),
            request.command,
            JSON.stringify(request.data ?? {}),
        ]);
        let output = "";
        let error = "";
        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });
        pythonProcess.stderr.on("data", (data) => {
            error += data.toString();
        });
        pythonProcess.on("close", (code) => {
            if (code === 0) {
                resolve(output);
            }
            else {
                reject(error);
            }
        });
    });
});
console.log("ELECTRON MAIN PROCESS STARTED");
app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
