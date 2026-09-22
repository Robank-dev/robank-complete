import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ro: {
          bg: '#0A0A0F',
          panel: '#101017',
          line: '#20202A',
          blue: '#6EA8FF',
          purple: '#8B7CFF'
        }
      }
    }
  },
  plugins: []
};

export default config;
