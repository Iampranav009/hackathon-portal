import type { Config } from "tailwindcss";
const config: Config = {
  // Dark mode is class-based and no page ever adds the .dark class, so the
  // site is consistently light-only: Home / Must Attend used to auto-darken
  // for dark-mode users while Swipe stayed white. One clean minimal theme.
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
