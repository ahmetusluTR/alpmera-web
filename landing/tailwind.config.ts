/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        alpmera: {
          primary: "#1B4D3E",        /* Deep Forest */
          secondary: "#E8DED1",      /* Warm Stone */
          accent: "#C9A962",         /* Muted Gold */
          success: "#3A6B5A",        /* Forest Light */
          danger: "#8B3A3A",         /* Muted Burgundy */
          text: "#2D2D2D",           /* Soft Black */
          "text-light": "#5A5A5A",   /* Secondary text */
          background: "#FAFAF8",     /* Off-white warm */
          border: "#D4CFC7",         /* Warm gray */
          "table-alt": "#F5F2ED",    /* Alternating rows */
        },
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["Libre Baskerville", "Georgia", "serif"],
        body: ["Work Sans", "system-ui", "sans-serif"],
        sans: ["var(--brand-font-sans)", "Work Sans", "sans-serif"],
        serif: ["var(--brand-font-serif)", "Libre Baskerville", "serif"],
      },
      boxShadow: {
        soft: "var(--brand-shadow-sm)",
        calm: "var(--brand-shadow-md)",
        brand: "var(--brand-shadow-lg)",
      },
      borderRadius: {
        sm: "var(--brand-radius-sm)",
        md: "var(--brand-radius-md)",
        lg: "var(--brand-radius-lg)",
        xl: "var(--brand-radius-xl)",
      },
    },
  },
  plugins: [],
};
