/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        glass: 'var(--glass)',
        'glass-strong': 'var(--glass-strong)',
        ink: 'var(--ink)',
        soft: 'var(--soft)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        edge: 'var(--edge)',
        q1: 'var(--q1)',
        q2: 'var(--q2)',
        q3: 'var(--q3)',
        q4: 'var(--q4)',
        q1t: 'var(--q1-tint)',
        q2t: 'var(--q2-tint)',
        q3t: 'var(--q3-tint)',
        q4t: 'var(--q4-tint)',
        focus: 'var(--focus)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        glass: '22px',
        sheet: '28px',
        control: '14px',
        pill: '999px',
      },
      maxWidth: {
        page: '1200px',
        prose: '68ch',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        spring: 'cubic-bezier(0.32, 1.28, 0.54, 1)',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        lift: 'var(--shadow-lift)',
      },
      blur: {
        glass: '22px',
      },
    },
  },
  plugins: [],
};
