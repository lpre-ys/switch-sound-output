<script setup lang="ts">
import { inject, onMounted } from "vue";
import { useRouter } from "vue-router";
import { goNext } from "../lib/go-next";
import type { Ref } from "vue";

const router = useRouter();
const appVersion = __APP_VERSION__;
const settings = inject<Ref<Settings | null>>("settings");

onMounted(() => {
  setTimeout(() => {
    goNext(router, settings?.value);
  }, 1500);
});
</script>

<template>
  <div class="splash">
    <h1 class="title">Switch Sound Output</h1>
    <p class="version">v{{ appVersion }}</p>
  </div>
</template>

<style scoped>
.splash {
  width: 300px;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(160deg, rgba(20, 28, 48, 0.92), rgba(45, 60, 92, 0.86));
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
}

.title {
  margin: 0;
  font-size: 18px;
  color: #dfe9ff;
  letter-spacing: 0.04em;
}

.version {
  margin: 0;
  font-size: 12px;
  color: rgba(223, 233, 255, 0.5);
}
</style>
