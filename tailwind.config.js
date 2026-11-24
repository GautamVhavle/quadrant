/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        ink: 'var(--ink)',
        soft: 'var(--soft)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        strong: 'var(--line-strong)',
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
        field: '6px',
        control: '9px',
        pill: '999px',
      },
      maxWidth: {
        page: '1240px',
        prose: '68ch',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
