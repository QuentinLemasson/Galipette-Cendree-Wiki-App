import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      skew: {
        "30": "30deg",
      },
      gridTemplateColumns: {
        // Complex site-specific column configuration
        banner: "1fr 50% 1fr",
      },
    },
  },
  plugins: [],
};
export default config;
