<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import type { Ref } from "vue";

const router = useRouter();
const settings = inject<Ref<Settings | null>>("settings");

const currentDeviceId = ref<string>("");
const switching = ref(false);
const loading = ref(true);
const hovered = ref(false);
let unsubscribeHover: (() => void) | null = null;

const deviceMode = computed<"earphone" | "speaker" | "unknown">(() => {
  const s = settings?.value;
  if (!s) return "unknown";
  if (s.earphone && currentDeviceId.value === s.earphone.id) return "earphone";
  if (s.speaker && currentDeviceId.value === s.speaker.id) return "speaker";
  return "unknown";
});

const currentLayout = computed<DeviceLayout | null>(() => {
  const s = settings?.value;
  if (!s || deviceMode.value === "unknown") return null;
  return s.layout?.[deviceMode.value] ?? null;
});

const containerStyle = computed(() => {
  const layout = currentLayout.value;
  if (!layout) return { top: "132px", left: "196px" };
  return { top: layout.buttonTop + "px", left: layout.buttonLeft + "px" };
});

const buttonStyle = computed(() => {
  const layout = currentLayout.value;
  if (!layout) return {};
  return { borderColor: layout.buttonColor, color: layout.buttonColor };
});

const settingsIconStyle = computed(() => {
  const layout = currentLayout.value;
  if (!layout) return {};
  return { color: layout.buttonColor };
});

const mainBorderStyle = computed(() => {
  if (!hovered.value) return {};
  const layout = currentLayout.value;
  return { borderColor: layout ? layout.buttonColor : "rgba(255,255,255,0.12)" };
});

async function refreshCurrentDevice() {
  currentDeviceId.value = await window.appApi.getCurrentDevice();
}

onMounted(async () => {
  window.appApi.resize(300, 180);
  unsubscribeHover = window.appApi.onHoverChanged((isOver) => {
    hovered.value = isOver;
  });
  hovered.value = await window.appApi.getHoverState();
  await refreshCurrentDevice();
  loading.value = false;
});

onUnmounted(() => {
  unsubscribeHover?.();
});

async function changeDevice() {
  const s = settings?.value;
  if (!s) return;
  const targetId =
    deviceMode.value === "earphone" ? s.speaker?.id : s.earphone?.id;
  if (!targetId) return;

  switching.value = true;
  try {
    await window.appApi.setDefaultDevice(targetId);
    await refreshCurrentDevice();
  } finally {
    switching.value = false;
  }
}

function openSettings() {
  router.push("/settings");
}
</script>

<template>
  <div
    class="main"
    :class="{
      'bg-earphone': deviceMode === 'earphone',
      'bg-speaker': deviceMode === 'speaker',
      'state-unknown': deviceMode === 'unknown',
      'hovered': hovered,
    }"
    :style="mainBorderStyle"
  >
    <!-- 設定ボタン（右上） -->
    <button class="btn-settings clickable" :style="settingsIconStyle" @click="openSettings" title="Settings">
      ⚙
    </button>

    <!-- 対象外デバイス表示 -->
    <div v-if="!loading && deviceMode === 'unknown'" class="unknown-state">
      <span class="warning-icon">⚠</span>
      <p class="warning-text">対象外のデバイスです</p>
    </div>

    <!-- イヤホン/スピーカー時のChangeボタン -->
    <div v-else-if="!loading" class="device-state" :style="containerStyle">
      <button
        class="btn-change clickable"
        :disabled="switching"
        :style="buttonStyle"
        @click="changeDevice"
      >
        {{ switching ? "..." : "Change" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.main {
  width: 300px;
  height: 180px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}


.main.state-unknown {
  background: linear-gradient(160deg, rgba(20, 28, 48, 0.92), rgba(45, 60, 92, 0.86));
  backdrop-filter: blur(4px);
}

.main.bg-earphone,
.main.bg-speaker {
  /* background-imageはmain.jsのinsertCSSで設定（!important付き）するため、
     ここではショートハンドを使わない。ショートハンドはbackground-imageをリセットしてしまう */
  background-color: transparent;
}

.btn-settings {
  position: absolute;
  top: 6px;
  right: 8px;
  background: transparent;
  border: none;
  color: rgba(223, 233, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s, color 0.15s, background 0.15s;
}

.main.hovered .btn-settings {
  opacity: 1;
}

.btn-settings:hover {
  color: rgba(223, 233, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.unknown-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.warning-icon {
  font-size: 28px;
  color: #f5a623;
}

.warning-text {
  margin: 0;
  font-size: 13px;
  color: rgba(223, 233, 255, 0.75);
  font-family: "Segoe UI", sans-serif;
}

.device-state {
  position: absolute;
}

.btn-change {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-family: "Segoe UI", sans-serif;
  padding: 6px 20px;
  cursor: pointer;
  backdrop-filter: blur(12px) saturate(160%);
  letter-spacing: 0.04em;
}

.btn-change:hover:not(:disabled) {
  filter: brightness(1.2);
}

.btn-change:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
