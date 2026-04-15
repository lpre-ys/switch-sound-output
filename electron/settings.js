import Store from "electron-store";

// NOTE: SettingsView.vue の ref 初期値と同じ値を持つ。どちらかを変更したら両方変更すること。
const DEFAULT_LAYOUT = { buttonColor: "#ffffff", buttonTop: 132, buttonLeft: 196 };

const isDev = !!process.env.VITE_DEV_SERVER_URL;

const store = new Store({
  name: isDev ? "config-dev" : "config",
  defaults: {
    earphone: null,
    speaker: null,
    layout: {
      earphone: { ...DEFAULT_LAYOUT },
      speaker: { ...DEFAULT_LAYOUT },
    },
  },
});

export function loadSettings() {
  return {
    earphone: store.get("earphone"),
    speaker: store.get("speaker"),
    layout: store.get("layout"),
  };
}

export function saveSettings(_event, settings) {
  store.set("earphone", settings.earphone ?? null);
  store.set("speaker", settings.speaker ?? null);
  if (settings.layout) {
    store.set("layout", settings.layout);
  }
}
