"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

type Theme = "light" | "dark";
const KEY = "theme:v1";

const systemTheme = (): Theme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

/** Follows the system setting until the visitor chooses; the choice is a per-device convenience only. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored choice is only readable after mount
    setTheme(saved === "light" || saved === "dark" ? saved : systemTheme());
  }, []);

  if (!theme) return <span className="theme-toggle theme-toggle--pending" aria-hidden="true" />;

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(KEY, next);
        } catch {
          /* ignore */
        }
        setTheme(next);
      }}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
