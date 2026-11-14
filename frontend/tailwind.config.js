/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090E',
          900: '#0B0F17',
          850: '#101522',
          800: '#151C2C',
          700: '#1E273D',
          600: '#2A3654',
          500: '#3D4D75',
        },
        brand: {
          emerald: '#10B981',
          cyan: '#06B6D4',
          violet: '#8B5CF6',
          fuchsia: '#D946EF',
          rose: '#F43F5E',
          amber: '#F59E0B',
          spotify: '#1DB954',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-card': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}

