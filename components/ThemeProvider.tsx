"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
const Ctx = createContext<{ mode: ThemeMode; setMode: (mode: ThemeMode) => void }>({
  mode: "light",
  setMode: () => {},
});

function apply(mode: ThemeMode) {
  const actual = mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
  document.documentElement.dataset.theme = actual;
  document.documentElement.style.colorScheme = actual;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  useEffect(() => {
    const saved = (localStorage.getItem("bizdocs-theme") as ThemeMode | null) ?? "light";
    setMode(saved);
    apply(saved);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("bizdocs-theme", mode);
    apply(mode);
  }, [mode]);
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }