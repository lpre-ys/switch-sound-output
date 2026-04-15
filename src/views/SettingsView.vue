<script setup lang="ts">
import { ref, inject, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { goNext } from "../lib/go-next";
import type { Ref } from "vue";

const router = useRouter();
const settings = inject<Ref<Settings | null>>("settings");
const updateSettings = inject<(s: Settings) => void>("updateSettings");

const activeTab = ref<"device" | "layout">("device");
const devices = ref<AudioDevice[]>([]);
const earphoneId = ref<string>("");
const speakerId = ref<string>("");
// NOTE: electron/settings.js の DEFAULT_LAYOUT と同じ値。どちらかを変更したら両方変更すること。
const earphoneLayout = ref<DeviceLayout>({ buttonColor: "#ffffff", buttonTop: 132, buttonLeft: 196 });
const speakerLayout = ref<DeviceLayout>({ buttonColor: "#ffffff", buttonTop: 132, buttonLeft: 196 });
const saving = ref(false);

const TAB_HEIGHTS: Record<string, number> = { device: 295, layout: 375 };

onMounted(async () => {
  window.appApi.resize(300, TAB_HEIGHTS.device);
  try {
    devices.value = await window.appApi.getAudioDevices();
  } catch (e) {
    console.error("[SettingsView] getAudioDevices failed:", e);
  }

  if (settings?.value?.earphone) {
    earphoneId.value = settings.value.earphone.id;
  }
  if (settings?.value?.speaker) {
    speakerId.value = settings.value.speaker.id;
  }
  if (settings?.value?.layout?.earphone) {
    earphoneLayout.value = { ...settings.value.layout.earphone };
  }
  if (settings?.value?.layout?.speaker) {
    speakerLayout.value = { ...settings.value.layout.speaker };
  }
});

watch(activeTab, (tab) => {
  window.appApi.resize(300, TAB_HEIGHTS[tab]);
});

async function save() {
  saving.value = true;
  try {
    const earphoneRaw = devices.value.find((d) => d.id === earphoneId.value);
    const speakerRaw = devices.value.find((d) => d.id === speakerId.value);
    const earphone: AudioDevice | null = earphoneRaw ? { id: earphoneRaw.id, name: earphoneRaw.name } : null;
    const speaker: AudioDevice | null = speakerRaw ? { id: speakerRaw.id, name: speakerRaw.name } : null;
    const newSettings: Settings = {
      earphone,
      speaker,
      layout: {
        earphone: { ...earphoneLayout.value },
        speaker: { ...speakerLayout.value },
      },
    };
    await window.appApi.saveSettings(newSettings);
    updateSettings?.(newSettings);
    router.push("/main");
  } finally {
    saving.value = false;
  }
}

function back() {
  goNext(router, settings?.value);
}
</script>

<template>
  <div class="settings" :style="{ height: TAB_HEIGHTS[activeTab] + 'px' }">
    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'device' }]"
        @click="activeTab = 'device'"
      >Device</button>
      <button
        :class="['tab', { active: activeTab === 'layout' }]"
        @click="activeTab = 'layout'"
      >Layout</button>
    </div>

    <!-- Device tab -->
    <div v-if="activeTab === 'device'" class="tab-content">
      <div class="field">
        <label>Earphone device</label>
        <select v-model="earphoneId">
          <option value="">-- select --</option>
          <option v-for="d in devices" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
      <div class="field">
        <label>Speaker device</label>
        <select v-model="speakerId">
          <option value="">-- select --</option>
          <option v-for="d in devices" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
    </div>

    <!-- Layout tab -->
    <div v-if="activeTab === 'layout'" class="tab-content">
      <div class="layout-section">
        <div class="section-title">Earphone</div>
        <div class="field field-inline">
          <label>UI Color</label>
          <input type="color" class="color-input clickable" v-model="earphoneLayout.buttonColor" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Top (px)</label>
            <input type="number" class="num-input clickable" v-model.number="earphoneLayout.buttonTop" min="0" max="148" />
          </div>
          <div class="field">
            <label>Left (px)</label>
            <input type="number" class="num-input clickable" v-model.number="earphoneLayout.buttonLeft" min="0" max="268" />
          </div>
        </div>
      </div>

      <div class="layout-section">
        <div class="section-title">Speaker</div>
        <div class="field field-inline">
          <label>UI Color</label>
          <input type="color" class="color-input clickable" v-model="speakerLayout.buttonColor" />
        </div>

        <div class="field-row">
          <div class="field">
            <label>Top (px)</label>
            <input type="number" class="num-input clickable" v-model.number="speakerLayout.buttonTop" min="0" max="148" />
          </div>
          <div class="field">
            <label>Left (px)</label>
            <input type="number" class="num-input clickable" v-model.number="speakerLayout.buttonLeft" min="0" max="268" />
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn-back clickable" @click="back">Back</button>
      <button
        class="btn-save clickable"
        :disabled="saving || (!earphoneId && !speakerId)"
        @click="save"
      >Save</button>
    </div>
  </div>
</template>

<style scoped>
.settings {
  width: 300px;
  box-sizing: border-box;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(160deg, rgba(20, 28, 48, 0.92), rgba(45, 60, 92, 0.86));
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  color: #dfe9ff;
  font-family: "Segoe UI", sans-serif;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 7px;
  padding: 3px;
}

.tab {
  flex: 1;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: rgba(223, 233, 255, 0.55);
  font-size: 12px;
  font-family: "Segoe UI", sans-serif;
  padding: 5px 0;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
}

.tab.active {
  background: rgba(255, 255, 255, 0.14);
  color: #dfe9ff;
}

.tab:hover:not(.active) {
  color: rgba(223, 233, 255, 0.8);
}

/* Tab content */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

/* Device fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

label {
  font-size: 11px;
  color: rgba(223, 233, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: #dfe9ff;
  font-size: 13px;
  padding: 5px 8px;
  outline: none;
  cursor: pointer;
  width: 100%;
}

select:focus {
  border-color: rgba(100, 160, 255, 0.6);
}

select option {
  background: #1a2540;
  color: #dfe9ff;
}

/* Layout fields */
.layout-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(223, 233, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field-row {
  display: flex;
  gap: 10px;
}

.field-row .field {
  flex: 1;
}

.color-input {
  width: 40px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  background: transparent;
  padding: 2px;
  cursor: pointer;
}

.num-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: #dfe9ff;
  font-size: 13px;
  padding: 4px 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.num-input:focus {
  border-color: rgba(100, 160, 255, 0.6);
}

/* Actions */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
}

button {
  padding: 6px 18px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  font-family: "Segoe UI", sans-serif;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: #dfe9ff;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.18);
}

.btn-save {
  background: rgba(80, 140, 255, 0.75);
  color: #fff;
}

.btn-save:hover:not(:disabled) {
  background: rgba(80, 140, 255, 0.95);
}

.btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
