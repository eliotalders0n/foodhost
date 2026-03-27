import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

type ToastState = {
  duration: number;
  id: number;
  message: string | null;
  tone: ToastTone;
  hideToast: () => void;
  showToast: (message: string, tone?: ToastTone, duration?: number) => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  duration: 0,
  id: 0,
  message: null,
  tone: "info",
  hideToast: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    set({ duration: 0, message: null });
  },
  showToast: (message, tone = "info", duration = 2600) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    const nextId = Date.now();

    set({
      duration,
      id: nextId,
      message,
      tone,
    });

    hideTimer = setTimeout(() => {
      set((state) => (state.id === nextId ? { duration: 0, message: null } : state));
      hideTimer = null;
    }, duration);
  },
}));
