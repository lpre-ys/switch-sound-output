interface Window {
  appApi: {
    resize: (width: number, height: number) => void;
    loadSettings: () => Promise<Settings>;
    saveSettings: (settings: Settings) => Promise<void>;
    getAudioDevices: () => Promise<AudioDevice[]>;
    getCurrentDevice: () => Promise<string>;
    setDefaultDevice: (deviceId: string) => Promise<void>;
    getHoverState: () => Promise<boolean>;
    onHoverChanged: (callback: (isOver: boolean) => void) => () => void;
  };
}
