<script setup lang="ts">
import { ref, provide, onBeforeMount } from "vue";

const settings = ref<Settings | null>(null);

const updateSettings = (s: Settings) => {
  settings.value = s;
};

provide("settings", settings);
provide("updateSettings", updateSettings);

onBeforeMount(async () => {
  settings.value = await window.appApi.loadSettings();
});
</script>

<template>
  <router-view />
</template>
