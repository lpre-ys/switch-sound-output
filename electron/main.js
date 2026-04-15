import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { loadSettings, saveSettings } from "./settings.js";
import { getAudioDevices, getCurrentDevice, setDefaultDevice } from "./sound.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function enforceAlwaysOnTop(win) {
  win.setAlwaysOnTop(true, "pop-up-menu");
  win.moveTop();
}

async function loadCssImage(filename, win) {
  const imgPath = path.join(path.resolve("."), "custom", `${filename}.png`);
  try {
    const data = await readFile(imgPath, "base64");
    await win.webContents.insertCSS(
      `.bg-${filename} { background-image: url('data:image/png;base64,${data}') !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; }`
    );
  } catch {
    // 画像未配置の場合は無視
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 180,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: false,
    icon: path.join(__dirname, "..", "asset", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  enforceAlwaysOnTop(win);

  const reassertAlwaysOnTop = () => enforceAlwaysOnTop(win);
  win.on("show", reassertAlwaysOnTop);
  win.on("restore", reassertAlwaysOnTop);
  win.on("focus", reassertAlwaysOnTop);

  win.on("always-on-top-changed", (_event, isAlwaysOnTop) => {
    if (!isAlwaysOnTop) {
      enforceAlwaysOnTop(win);
    }
  });

  win.webContents.on("did-finish-load", async () => {
    await loadCssImage("earphone", win);
    await loadCssImage("speaker", win);
  });

  // IPC: window resize
  ipcMain.on("resize", (_event, width, height) => {
    win.setSize(Math.round(width), Math.round(height));
  });

  // カーソル位置をポーリングして透過ウィンドウのホバー検出
  let isOver = false;
  const hoverInterval = setInterval(() => {
    if (win.isDestroyed()) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = win.getBounds();
    const nowOver =
      cursor.x >= bounds.x && cursor.x < bounds.x + bounds.width &&
      cursor.y >= bounds.y && cursor.y < bounds.y + bounds.height;
    if (nowOver !== isOver) {
      isOver = nowOver;
      win.setIgnoreMouseEvents(!nowOver);
      win.webContents.send("hover-changed", nowOver);
    }
  }, 50);

  win.on("closed", () => clearInterval(hoverInterval));

  // IPC: hover state (初期状態取得用)
  ipcMain.handle("getHoverState", () => isOver);

  // IPC: settings
  ipcMain.handle("loadSettings", loadSettings);
  ipcMain.handle("saveSettings", saveSettings);

  // IPC: audio devices
  ipcMain.handle("getAudioDevices", getAudioDevices);
  ipcMain.handle("getCurrentDevice", getCurrentDevice);
  ipcMain.handle("setDefaultDevice", setDefaultDevice);

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
