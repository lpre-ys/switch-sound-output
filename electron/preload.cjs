const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appApi", {
  // ウィンドウリサイズ
  resize: (width, height) => ipcRenderer.send("resize", width, height),

  // 設定
  loadSettings: () => ipcRenderer.invoke("loadSettings"),
  saveSettings: (settings) => ipcRenderer.invoke("saveSettings", settings),

  // オーディオデバイス
  getAudioDevices: () => ipcRenderer.invoke("getAudioDevices"),
  getCurrentDevice: () => ipcRenderer.invoke("getCurrentDevice"),
  setDefaultDevice: (deviceId) => ipcRenderer.invoke("setDefaultDevice", deviceId),

  // ホバー検出（メインプロセスのポーリングから通知）
  getHoverState: () => ipcRenderer.invoke("getHoverState"),
  onHoverChanged: (callback) => {
    const handler = (_e, isOver) => callback(isOver);
    ipcRenderer.on("hover-changed", handler);
    return () => ipcRenderer.removeListener("hover-changed", handler);
  },
});
