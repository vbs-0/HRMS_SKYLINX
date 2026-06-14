"use client";

import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

const THEME_KEY = "peopleos_theme";
const DENSITY_KEY = "peopleos_density";

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && systemDark());
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as ThemePref) || "system";
    const d = (localStorage.getItem(DENSITY_KEY) as Density) || "comfortable";
    setPref(t);
    setDensityState(d);
  }, []);

  const setTheme = (t: ThemePref) => {
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
    setPref(t);
  };
  const cycleTheme = () => setTheme(pref === "light" ? "dark" : pref === "dark" ? "system" : "light");
  const setDensity = (d: Density) => {
    localStorage.setItem(DENSITY_KEY, d);
    document.documentElement.setAttribute("data-density", d);
    setDensityState(d);
  };

  return { pref, density, setTheme, cycleTheme, setDensity };
}
