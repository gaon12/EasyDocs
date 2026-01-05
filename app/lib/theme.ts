/**
 * Theme utilities for managing light/dark mode
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Get the current system theme preference
 */
export const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/**
 * Subscribe to system theme changes
 * @param callback Function to call when theme changes
 * @returns Cleanup function to unsubscribe
 */
export const subscribeToSystemTheme = (callback: (theme: ResolvedTheme) => void) => {
  if (typeof window === "undefined") return () => {};

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
};

/**
 * Resolve a theme value to either "light" or "dark"
 */
export const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
};
