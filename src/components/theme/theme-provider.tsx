"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "ledger" | "pulse";
export type Density = "compact" | "regular" | "cozy";

interface ThemeContextValue {
  theme: Theme;
  density: Density;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "visory-theme";
const DENSITY_KEY = "visory-density";

function applyClasses(theme: Theme, density: Density) {
  const root = document.documentElement;
  root.classList.remove("theme-ledger", "theme-pulse");
  root.classList.add(`theme-${theme}`);
  root.classList.remove("density-compact", "density-regular", "density-cozy");
  root.classList.add(`density-${density}`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("ledger");
  const [density, setDensityState] = useState<Density>("compact");

  // Hydrate the stored preference once on mount and sync the root classes.
  // Intentional setState-in-effect: the persisted value is only available
  // client-side, so React state is reconciled after hydration.
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const storedDensity = localStorage.getItem(DENSITY_KEY) as Density | null;
    const t = storedTheme === "pulse" || storedTheme === "ledger" ? storedTheme : "ledger";
    const d =
      storedDensity === "compact" || storedDensity === "cozy" || storedDensity === "regular"
        ? storedDensity
        : "compact";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(t);
    setDensityState(d);
    applyClasses(t, d);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyClasses(t, (localStorage.getItem(DENSITY_KEY) as Density) || "compact");
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    localStorage.setItem(DENSITY_KEY, d);
    applyClasses((localStorage.getItem(THEME_KEY) as Theme) || "ledger", d);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "ledger" ? "pulse" : "ledger");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, density, setTheme, setDensity, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
