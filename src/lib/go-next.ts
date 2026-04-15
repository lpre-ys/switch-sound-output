import type { Router } from "vue-router";

export async function goNext(router: Router, settings?: Settings | null): Promise<void> {
  try {
    const s = settings ?? await window.appApi.loadSettings();
    if (!s.earphone && !s.speaker) {
      router.push("/settings");
    } else {
      router.push("/main");
    }
  } catch (e) {
    console.error("[goNext] loadSettings failed:", e);
    router.push("/settings");
  }
}
