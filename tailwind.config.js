/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0d0f14',
        surface: '#151820',
        surface2:'#1c2030',
        border:  '#2a3045',
        accent:  '#4fffb0',
        accent2: '#ff6b6b',
        accent3: '#ffce56',
        accent4: '#a78bfa',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      }
    }
  },
  plugins: []
}
