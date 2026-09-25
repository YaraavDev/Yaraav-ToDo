import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export const Button: React.FC<ButtonProps> = ({ variant = "primary", className = "", children, ...rest }) => {
  const base = "px-4 py-2 rounded-pill text-sm font-medium transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-light-accent text-light-bg dark:bg-dark-accent dark:text-dark-bg hover:opacity-90",
    ghost:
      "bg-transparent border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:bg-light-card dark:hover:bg-dark-card",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
};
