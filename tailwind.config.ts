import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        battle: {
          red: "hsl(var(--battle-red))",
          dark: "hsl(var(--battle-dark))",
          DEFAULT: "hsl(var(--battle-red))",
        },
        health: "hsl(var(--health-green))",
        energy: "hsl(var(--energy-blue))",
        warning: "hsl(var(--warning-orange))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "battle-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.05)", filter: "brightness(1.2)" },
        },
        "enemy-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "stickman-walk": {
          "0%": { transform: "translateX(0px) scaleX(1)" },
          "25%": { transform: "translateX(2px) scaleX(1)" },
          "50%": { transform: "translateX(0px) scaleX(1)" },
          "75%": { transform: "translateX(-2px) scaleX(1)" },
          "100%": { transform: "translateX(0px) scaleX(1)" },
        },
        "damage-flash": {
          "0%": { backgroundColor: "hsl(0 72% 51% / 0)" },
          "50%": { backgroundColor: "hsl(0 72% 51% / 0.3)" },
          "100%": { backgroundColor: "hsl(0 72% 51% / 0)" },
        },
        "screen-shake": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-2px, 2px)" },
          "50%": { transform: "translate(2px, -2px)" },
          "75%": { transform: "translate(-2px, -2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "battle-pulse": "battle-pulse 2s ease-in-out infinite",
        "enemy-float": "enemy-float 3s ease-in-out infinite",
        "stickman-walk": "stickman-walk 0.6s ease-in-out infinite",
        "damage-flash": "damage-flash 0.3s ease-out",
        "screen-shake": "screen-shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
