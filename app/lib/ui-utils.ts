/**
 * UI utility functions for common styling patterns
 */

export type UITheme = "light" | "dark";

/**
 * Get theme-dependent class names for common UI elements
 */
export const getThemeClasses = (isDark: boolean) => ({
  header: isDark
    ? "border-white/10 bg-slate-950/80 text-slate-200"
    : "border-black/5 bg-white/80 text-slate-600",

  panel: isDark
    ? "border-white/10 bg-slate-900 text-slate-100"
    : "border-black/5 bg-white text-slate-900",

  mutedText: isDark ? "text-slate-400" : "text-slate-500",

  card: isDark
    ? "border-white/10 bg-slate-800/80"
    : "border-black/5 bg-slate-50",

  control: isDark
    ? "border-white/10 bg-slate-800 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
    : "border-black/10 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700",

  activeOption: isDark
    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
    : "border-emerald-300 bg-emerald-50 text-emerald-700",

  divider: isDark ? "bg-white/10" : "bg-black/10",

  text: isDark ? "text-slate-100" : "text-slate-900",

  closeButton: isDark
    ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
});

/**
 * Common modal overlay classes
 */
export const MODAL_OVERLAY_CLASS = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm";

/**
 * Common button style classes
 */
export const getButtonClasses = (variant: "primary" | "secondary" | "ghost", isDark: boolean) => {
  const base = "rounded-lg px-3 py-2 text-xs font-semibold transition";

  switch (variant) {
    case "primary":
      return `${base} bg-emerald-600 text-white hover:bg-emerald-700`;

    case "secondary":
      return `${base} border ${isDark
        ? "border-white/10 bg-slate-800 text-slate-200 hover:border-emerald-400"
        : "border-black/10 bg-white text-slate-600 hover:border-emerald-200"}`;

    case "ghost":
      return `${base} ${isDark
        ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        : "text-slate-600 hover:bg-slate-100"}`;

    default:
      return base;
  }
};

/**
 * Format metadata value (array or string)
 */
export const formatMetaValue = (value: string | string[]): string => {
  return Array.isArray(value) ? value.join(", ") : value;
};

/**
 * Sanitize document label for use in HTML attributes
 */
export const sanitizeForAttribute = (value: string): string => {
  return value.replace(/"/g, "&quot;");
};
