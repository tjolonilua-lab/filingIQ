import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'filingiq-blue': '#00A3FF', // Primary blue from design
        'filingiq-dark': '#0A1929', // Dark background
        'filingiq-light': '#E3F2FD', // Light blue accent
        'filingiq-accent': '#00D4FF', // Bright accent blue
        'filingiq-cyan': '#00D4FF', // Neon cyan
        'filingiq-neon': '#00FFFF', // Bright neon
        // Legacy colors for backward compatibility
        'flo-navy': '#1e3a5f',
        'flo-gold': '#d4af37',
        'flo-green': '#22c55e',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.2)',
        'glow-blue': '0 0 20px rgba(0, 163, 255, 0.3), 0 0 40px rgba(0, 163, 255, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config

