import * as React from "react";

type Ctx = { theme: string; resolvedTheme: string; setTheme: (t: string) => void; systemTheme: string };
const ThemeCtx = React.createContext<Ctx>({ theme: "light", resolvedTheme: "light", setTheme: () => {}, systemTheme: "light" });

export function ThemeProvider({ children }: any) {
  const initial = (() => {
    try {
      return localStorage.getItem("theme") || "light";
    } catch {
      return "light";
    }
  })();
  const [theme, setThemeState] = React.useState(initial);
  const system = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const resolved = theme === "system" ? system : theme;
  React.useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);
  const setTheme = (t: string) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
    setThemeState(t);
  };
  return <ThemeCtx.Provider value={{ theme, resolvedTheme: resolved, setTheme, systemTheme: system }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeCtx);
}
