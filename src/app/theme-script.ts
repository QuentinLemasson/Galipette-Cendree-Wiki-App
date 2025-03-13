/**
 * Theme initialization script to prevent theme flickering during page load.
 *
 * This script:
 * - Runs before React hydration to set the correct theme class
 * - Checks localStorage for a saved theme preference
 * - Falls back to system preference if no saved theme exists
 * - Applies the appropriate class to the document element
 *
 * @module theme-script
 */

/**
 * Generates a self-executing script that sets the theme before React hydration.
 *
 * The script:
 * 1. Checks localStorage for a 'theme' value
 * 2. If found and valid ('dark' or 'light'), applies that theme
 * 3. If not found, checks system preference using matchMedia
 * 4. Applies the appropriate 'dark' class to the HTML element
 *
 * @returns {string} A self-executing JavaScript function as a string
 *
 * @example
 * ```tsx
 * <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
 * ```
 */
export function themeScript() {
  const themeScript = `
    (function() {
      // Try to get theme from localStorage
      const storedTheme = localStorage.getItem('theme');
      
      // If we have a stored theme, use it
      if (storedTheme === 'dark' || storedTheme === 'light') {
        document.documentElement.classList.toggle('dark', storedTheme === 'dark');
      } 
      // Otherwise, check system preference
      else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      }
    })()
  `;

  return themeScript;
}
