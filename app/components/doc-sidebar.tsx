"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type DocSection = {
  title: string;
  items: Array<{
    title: string;
    href: string;
    badge?: string;
  }>;
};

type DocSidebarProps = {
  sections: DocSection[];
  isDark?: boolean;
};

/**
 * Documentation sidebar navigation
 */
export function DocSidebar({ sections, isDark = false }: DocSidebarProps) {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    if (isDark) {
      return isActive
        ? "flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-400 transition"
        : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200";
    }
    return isActive
      ? "flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition"
      : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900";
  };

  const sectionTitleClass = isDark
    ? "text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
    : "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500";

  return (
    <nav className="sticky top-4 space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className={sectionTitleClass}>{section.title}</h3>
          <ul className="mt-3 space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass(item.href)}>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
