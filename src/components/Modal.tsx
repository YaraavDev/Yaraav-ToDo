import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-card shadow-2xl animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border">
          <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-light-card dark:hover:bg-dark-card text-light-subtext dark:text-dark-subtext"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-light-border dark:border-dark-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
