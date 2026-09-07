import React from "react";
import { Sun, Moon } from "lucide-react";
import useThemeStore from "../store/themeStore.js";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-16 h-9 rounded-full bg-bg-secondary border border-border-main relative flex items-center cursor-pointer select-none p-[3px] transition-all duration-300 hover:brightness-105 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-indigo/50"
      aria-label="Toggle Theme"
    >
      {/* Background Track Icons */}
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
        <Sun className="w-[14px] h-[14px] text-text-secondary opacity-40" />
        <Moon className="w-[14px] h-[14px] text-text-secondary opacity-40" />
      </div>

      {/* Sliding Circle (Thumb) */}
      <div
        className={`w-7 h-7 rounded-full bg-bg-card border border-border-main shadow flex items-center justify-center transition-transform duration-500 ease-in-out transform ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-accent-purple animate-pulse" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-warning" />
        )}
      </div>
    </button>
  );
}
