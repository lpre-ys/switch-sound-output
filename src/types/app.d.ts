interface AudioDevice {
  id: string;
  name: string;
}

interface DeviceLayout {
  buttonColor: string;
  buttonTop: number;
  buttonLeft: number;
}

interface Settings {
  earphone: AudioDevice | null;
  speaker: AudioDevice | null;
  layout: {
    earphone: DeviceLayout;
    speaker: DeviceLayout;
  };
}
