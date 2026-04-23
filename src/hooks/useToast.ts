import { useState } from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
  ttlMs: number;
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, tone: ToastTone = "info") => {
    const ttlMs = 4200;
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, tone, ttlMs }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, ttlMs);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return { toasts, showToast, dismissToast };
};
