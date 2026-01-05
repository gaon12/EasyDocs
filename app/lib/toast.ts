/**
 * Toast notification system
 * Simple event-based toast notifications without external dependencies
 */

export type ToastType = "success" | "error" | "info" | "loading";

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

const TOAST_EVENT = "easydocs:toast";

/**
 * Show a toast notification
 * @param type Type of toast (success, error, info, loading)
 * @param message Message to display
 * @param duration Duration in ms (default: 3000, set to 0 for persistent)
 * @returns Toast ID for dismissal
 */
export const showToast = (
  type: ToastType,
  message: string,
  duration: number = 3000
): string => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const toast: ToastMessage = {
    id,
    type,
    message,
    duration,
  };

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: toast,
    })
  );

  return id;
};

/**
 * Dismiss a toast by ID
 */
export const dismissToast = (id: string) => {
  window.dispatchEvent(
    new CustomEvent(`${TOAST_EVENT}:dismiss`, {
      detail: { id },
    })
  );
};

/**
 * Subscribe to toast events
 * @param callback Function to call when toast is shown
 * @returns Cleanup function
 */
export const subscribeToToast = (callback: (toast: ToastMessage) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ToastMessage>;
    callback(customEvent.detail);
  };

  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
};

/**
 * Subscribe to toast dismiss events
 */
export const subscribeToDismiss = (callback: (id: string) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ id: string }>;
    callback(customEvent.detail.id);
  };

  window.addEventListener(`${TOAST_EVENT}:dismiss`, handler);
  return () => window.removeEventListener(`${TOAST_EVENT}:dismiss`, handler);
};

/**
 * Convenience methods for common toast types
 */
export const toast = {
  success: (message: string, duration?: number) => showToast("success", message, duration),
  error: (message: string, duration?: number) => showToast("error", message, duration),
  info: (message: string, duration?: number) => showToast("info", message, duration),
  loading: (message: string) => showToast("loading", message, 0), // Persistent
};
