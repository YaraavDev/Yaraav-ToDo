import React from "react";

export const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = "" }) => (
  <div className={`w-full h-2 rounded-pill bg-light-border dark:bg-dark-border overflow-hidden ${className}`}>
    <div
      className="h-full bg-light-accent dark:bg-dark-accent transition-all duration-500 rounded-pill"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
