"use client";

import { useState, useEffect } from "react";
import { Languages, Check } from "lucide-react";
import {
  getLocale,
  setLocale,
  subscribeToLocaleChange,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  type Locale,
} from "@/app/lib/i18n";

type LanguageSwitcherProps = {
  isDark?: boolean;
};

/**
 * Language switcher component
 */
export function LanguageSwitcher({ isDark = false }: LanguageSwitcherProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentLocale(getLocale());
    return subscribeToLocaleChange(setCurrentLocale);
  }, []);

  const handleChange = (locale: Locale) => {
    setLocale(locale);
    setCurrentLocale(locale);
    setIsOpen(false);
  };

  const buttonClass = isDark
    ? "flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300"
    : "flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700";

  const dropdownClass = isDark
    ? "absolute right-0 mt-2 w-40 rounded-lg border border-white/10 bg-slate-900 shadow-lg"
    : "absolute right-0 mt-2 w-40 rounded-lg border border-black/10 bg-white shadow-lg";

  const itemClass = (locale: Locale) => {
    const isActive = currentLocale === locale;
    if (isDark) {
      return isActive
        ? "block w-full px-4 py-2 text-left text-sm font-semibold text-emerald-400 transition hover:bg-slate-800"
        : "block w-full px-4 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800";
    }
    return isActive
      ? "block w-full px-4 py-2 text-left text-sm font-semibold text-emerald-700 transition hover:bg-slate-50"
      : "block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        aria-label="Change language"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_NAMES[currentLocale]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`${dropdownClass} z-20`}>
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                onClick={() => handleChange(locale)}
                className={itemClass(locale)}
              >
                <span className="flex-1">{LOCALE_NAMES[locale]}</span>
                {currentLocale === locale && (
                  <Check className="ml-2 h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
