import React from "react";
import { useThemeStore } from "@/store/themeStore";

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      className="w-11 h-6 rounded-pill bg-light-border dark:bg-dark-border relative transition-colors"
      aria-label="toggle theme"
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-light-accent dark:bg-dark-accent transition-all duration-200 ${
          theme === "dark" ? "left-0.5" : "left-5"
        }`}
      />
      <span className="sr-only">{theme}</span>
    </button>
  );
};
