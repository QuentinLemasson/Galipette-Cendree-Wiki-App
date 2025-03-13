# Theme Implementation Documentation

This documentation provides extensive insights about the inner workings of this app's theme system.

## Overview

The application implements a simple yet robust theme system that supports both light and dark modes. The theme implementation is built on top of Tailwind CSS's dark mode functionality and uses React's Context API for state management.

## Key Components

### 1. ThemeProvider

The `ThemeProvider` is the core of the theme system. It manages the theme state and provides it to all components in the application.

**Location**: `src/store/ThemeProvider.tsx`

**Features**:

- Initializes theme from localStorage or system preference
- Updates the document class when theme changes
- Persists theme preference to localStorage
- Provides theme context to child components

**Usage**:

```tsx
// In src/app/layout.tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

### 2. useTheme Hook

A custom hook that provides access to the theme context.

**Location**: `src/store/ThemeProvider.tsx`

**Features**:

- Returns the current theme ('light' or 'dark')
- Provides a function to toggle between themes
- Throws an error if used outside of a ThemeProvider

**Usage**:

```tsx
const { theme, toggleTheme } = useTheme();

// Check current theme
if (theme === "dark") {
  // Do something for dark theme
}

// Toggle theme
<button onClick={toggleTheme}>Toggle Theme</button>;
```

### 3. ThemeToggle Component

A button component that toggles between light and dark themes.

**Location**: `src/components/ThemeToggle.tsx`

**Features**:

- Displays a moon icon in light mode and a sun icon in dark mode
- Toggles the theme when clicked
- Provides appropriate aria-label for accessibility
- Includes hover effects that respect the current theme

**Usage**:

```tsx
<ThemeToggle />
```

### 4. Theme Script

A script that sets the theme before React hydration to prevent theme flickering.

**Location**: `src/app/theme-script.ts`

**Features**:

- Runs before React hydration
- Checks localStorage for a saved theme preference
- Falls back to system preference if no saved theme exists
- Applies the appropriate class to the document element

**Usage**:

```tsx
// In src/app/layout.tsx
<script dangerouslySetInnerHTML={{ __html: themeScript() }} />
```

## How It Works

### Theme Initialization

1. When the page loads, the `theme-script.ts` runs before React hydration and sets the appropriate theme class on the HTML element based on:

   - The theme stored in localStorage (if available)
   - The system preference (if no stored theme)

2. The `ThemeProvider` initializes with the theme from:
   - localStorage (if available)
   - system preference (if no stored theme)

### Theme Toggling

1. When the user clicks the `ThemeToggle` button, the `toggleTheme` function is called.
2. The `toggleTheme` function updates the theme state in the `ThemeProvider`.
3. When the theme state changes, a useEffect hook in the `ThemeProvider`:
   - Updates the class on the HTML element
   - Saves the new theme to localStorage

### CSS Implementation

The theme system leverages Tailwind CSS's dark mode functionality:

1. In `tailwind.config.ts`, dark mode is set to "class", which means dark mode styles are applied when the "dark" class is present on the HTML element.
2. Dark mode styles are defined using the `dark:` prefix in Tailwind classes.

Example:

```tsx
<div className="bg-white text-black dark:bg-gray-800 dark:text-white">
  This div has a white background and black text in light mode, and a dark gray
  background with white text in dark mode.
</div>
```

## Theme Variables

The application uses CSS variables for theming, defined in `src/app/globals.css`. These variables are used by Tailwind to generate the theme colors.

Light mode variables are defined in the `:root` selector, while dark mode variables are defined in the `.dark` selector.

## Best Practices

1. **Always use the useTheme hook** for accessing theme information instead of checking classes directly.

2. **Use Tailwind's dark mode classes** (`dark:*`) for styling components differently in dark mode.

3. **Keep theme-specific logic in components** to a minimum. Use the theme context when needed.

4. **Test components in both themes** to ensure they look good in both light and dark modes.

## Extending the Theme System

### Adding More Theme Options

To add more theme options beyond light and dark:

1. Update the `Theme` type in `ThemeProvider.tsx`:

```tsx
type Theme = "light" | "dark" | "system" | "custom";
```

2. Add logic to handle the new theme options in the `ThemeProvider`.

3. Update the `ThemeToggle` component to display different icons for each theme.

### Adding Theme-Specific Components

For components that need significant changes between themes:

1. Use the `useTheme` hook to get the current theme.
2. Render different components or apply different styles based on the theme.

```tsx
const { theme } = useTheme();

return theme === "dark" ? <DarkModeComponent /> : <LightModeComponent />;
```

## Troubleshooting

### Theme Flickering

If you experience theme flickering during page load:

1. Make sure the theme script is included in the `<head>` of the document.
2. Verify that `suppressHydrationWarning` is added to the HTML element.

### Theme Not Persisting

If the theme is not persisting between page refreshes:

1. Check that localStorage is being set correctly in the `ThemeProvider`.
2. Verify that the theme script is correctly reading from localStorage.

### Components Not Respecting Theme

If components are not respecting the theme:

1. Make sure the component is wrapped in the `ThemeProvider`.
2. Check that the component is using the `useTheme` hook correctly.
3. Verify that the component is using Tailwind's dark mode classes correctly.
