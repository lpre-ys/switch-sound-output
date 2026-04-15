import { createRouter, createWebHashHistory } from "vue-router";
import SplashView from "../views/SplashView.vue";

const routes = [
  { path: "/", name: "splash", component: SplashView },
  {
    path: "/main",
    name: "main",
    component: () => import("../views/MainView.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../views/SettingsView.vue"),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
