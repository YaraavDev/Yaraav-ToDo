import React from "react";
import { useToastStore } from "@/store/toastStore";

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-pill text-sm font-medium shadow-lg animate-slideUp
          ${t.variant === "error" ? "bg-red-600 text-white" : "bg-light-accent text-light-bg dark:bg-dark-accent dark:text-dark-bg"}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};
