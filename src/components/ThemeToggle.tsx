"use client";

import { useTheme } from "@/store/ThemeProvider";
import { Moon, Sun } from "lucide-react";

/**
 * ThemeToggle component provides a button to switch between light and dark themes.
 *
 * This component:
 * - Displays a moon icon in light mode and a sun icon in dark mode
 * - Toggles the theme when clicked
 * - Provides appropriate aria-label for accessibility
 * - Includes hover effects that respect the current theme
 *
 * @component
 * @returns {JSX.Element} A button that toggles between light and dark themes
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @remarks
 * This component must be used within a ThemeProvider as it relies on the useTheme hook.
 * The component automatically adapts its appearance based on the current theme.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-gray-700" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-300" />
      )}
    </button>
  );
}
