import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...rest }) => (
  <div
    className={`bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-card p-4 animate-fadeIn ${className}`}
    {...rest}
  >
    {children}
  </div>
);
