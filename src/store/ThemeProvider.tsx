"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Represents the available theme options in the application.
 * @typedef {'light' | 'dark'} Theme - The theme options available to users.
 */
type Theme = "light" | "dark";

/**
 * Interface defining the shape of the ThemeContext.
 * @interface ThemeContextType
 * @property {Theme} theme - The current active theme ('light' or 'dark').
 * @property {() => void} toggleTheme - Function to toggle between light and dark themes.
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * React Context for managing theme state across the application.
 * @type {React.Context<ThemeContextType | undefined>}
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component that manages theme state and provides it to the application.
 *
 * This component:
 * - Initializes theme from localStorage or system preference
 * - Updates the document class when theme changes
 * - Persists theme preference to localStorage
 * - Provides theme context to child components
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the theme context
 * @returns {JSX.Element} ThemeContext.Provider wrapping the children
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem("theme") as Theme;

    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Update document class when theme changes
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  /**
   * Toggles between light and dark themes.
   * Updates the theme state which triggers the effect to update document class and localStorage.
   */
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access the theme context.
 *
 * @returns {ThemeContextType} The theme context containing the current theme and toggle function
 * @throws {Error} If used outside of a ThemeProvider
 *
 * @example
 * ```tsx
 * const { theme, toggleTheme } = useTheme();
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
