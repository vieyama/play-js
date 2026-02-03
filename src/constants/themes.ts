import dracula from "@/assets/editor-themes/Dracula.json";
import monokai from "@/assets/editor-themes/Monokai.json";
import nightOwl from "@/assets/editor-themes/NightOwl.json";

export const customThemes = {
  dracula,
  monokai,
  'night-owl': nightOwl
};

export const builtinThemes = ["vs-dark", "vs-light", "hc-black"] as const;

export type ThemeKey = keyof typeof customThemes | (typeof builtinThemes)[number];

export const themeBackgrounds: Record<ThemeKey, string> = {
  "vs-dark": "#1e1e1e",
  "vs-light": "#ffffff",
  "hc-black": "#000000",
  dracula: dracula.colors["editor.background"] || "#1e1e1e",
  monokai: monokai.colors["editor.background"] || "#272822",
  'night-owl': nightOwl.colors["editor.background"] || "#011627",
};
