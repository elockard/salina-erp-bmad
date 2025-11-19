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
        brand: {
          deep: '#1e3a8a',    // Navy blue (primary)
          warm: '#d97706',     // Amber (accents)
          neutral: '#64748b',  // Slate (text)
          success: '#059669',  // Emerald (positive)
          error: '#dc2626',    // Red (alerts)
        },
      },
    },
  },
  plugins: [],
};
export default config;
