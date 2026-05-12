import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds — warm cream light theme
        'app-base': '#fafaf8',
        'surface-0': '#fafaf8',
        'surface-1': '#ffffff',
        'surface-2': '#f5f5f5',
        'surface-3': '#eeeeee',
        'border-1': '#e8e6e3',
        'border-2': '#d8d6d3',
        'border-3': '#c8c6c3',
        
        // Gold — Tia's identity
        'gold': '#c9a96e',
        'gold-deep': '#906030',
        'gold-light': '#e0b97e',
        'gold-glow': 'rgba(201,169,110,.25)',
        'gold-shimmer-std': 'rgba(201,169,110,.20)',
        'gold-shimmer-strong': 'rgba(201,169,110,.35)',
        
        // Text
        'text-primary': '#0a0a0a',
        'text-secondary': '#666666',
        'text-muted': '#999999',
        'text-ghost': '#cccccc',
        'text-invisible': '#e8e8e8',
        
        // Status
        'work-blue': '#3a6fae',
        'work-blue-text': '#5a8fc4',
        'personal-purple': '#7a4fae',
        'personal-purple-text': '#9a5fc4',
        'done-green': '#4a9a4a',
        'done-green-text': '#5aaa5a',
        'overdue-red': '#d06030',
        
        // Carry-over states
        'carry-1-bg': '#100e08',
        'carry-1-border': '#1e1a08',
        'carry-1-accent': '#786020',
        'carry-2-bg': '#140e08',
        'carry-2-border': '#221808',
        'carry-2-accent': '#c9a96e',
        'carry-3-bg': '#180a08',
        'carry-3-border': '#2a1008',
        'carry-3-accent': '#d06030',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tighter-03': '-0.03em',
        'tighter-02': '-0.02em',
        'tighter-01': '-0.01em',
        'wider-03': '0.03em',
        'wider-04': '0.04em',
        'wider-08': '0.08em',
      },
      boxShadow: {
        'gold-glow': '0 4px 16px rgba(201,169,110,.25)',
        'gold-strong': '0 6px 24px rgba(201,169,110,.4)',
        'gold-subtle': '0 8px 32px rgba(201,169,110,.15)',
        'dot-gold': '0 0 6px rgba(201,169,110,.66)',
        'dot-green': '0 0 5px rgba(74,154,74,.44)',
        'dot-red': '0 0 5px rgba(208,96,48,.44)',
        'dot-indigo': '0 0 5px rgba(96,96,208,.44)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a96e, #906030)',
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(201,169,110,.20), transparent)',
        'gold-shimmer-strong': 'linear-gradient(90deg, transparent, rgba(201,169,110,.35), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
