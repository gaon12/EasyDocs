"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

type ViewerErrorStateProps = {
  title: string;
  description: string;
  details?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  showRetry?: boolean;
};

export function ViewerErrorState({
  title,
  description,
  details,
  action,
  showRetry = true,
}: ViewerErrorStateProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-full w-full items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/5 bg-white/90 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-300 to-emerald-500" />
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-50 shadow-inner">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h2 className="font-display text-xl text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        {details ? <p className="mt-3 text-xs text-slate-400">{details}</p> : null}

        <div className="mt-6 flex flex-col gap-2">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-emerald-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}

          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 transition hover:bg-emerald-50"
              >
                {action.label}
              </Link>
            ) : action.onClick ? (
              <button
                onClick={action.onClick}
                className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 transition hover:bg-emerald-50"
              >
                {action.label}
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
