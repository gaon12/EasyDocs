"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, Loader2, X } from "lucide-react";
import {
  subscribeToToast,
  subscribeToDismiss,
  dismissToast,
  type ToastMessage,
} from "@/app/lib/toast";

/**
 * Toast notification container
 * Add this component to your root layout to enable toast notifications
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribeToast = subscribeToToast((toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss if duration is set
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration);
      }
    });

    const unsubscribeDismiss = subscribeToDismiss((id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      unsubscribeToast();
      unsubscribeDismiss();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end justify-end gap-2 p-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: ToastMessage }) {
  const { id, type, message } = toast;

  const typeStyles = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
    loading: "bg-slate-700 text-white",
  };

  const getIcon = (type: ToastMessage["type"]) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "success":
        return <CheckCircle className={iconClass} />;
      case "error":
        return <XCircle className={iconClass} />;
      case "info":
        return <Info className={iconClass} />;
      case "loading":
        return <Loader2 className={`${iconClass} animate-spin`} />;
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all ${typeStyles[type]}`}
      style={{
        animation: "slideIn 0.2s ease-out",
      }}
    >
      {getIcon(type)}
      <p className="text-sm font-medium">{message}</p>
      {type !== "loading" && (
        <button
          onClick={() => dismissToast(id)}
          className="ml-2 rounded p-1 transition hover:bg-white/20"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
