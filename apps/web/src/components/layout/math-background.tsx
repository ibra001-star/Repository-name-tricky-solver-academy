'use client';

import { motion } from 'framer-motion';

const symbols = ['∑', '∫', 'π', '√', '∞', 'Δ', '÷', '×', '%', 'θ', '≈', 'x²'];

// A lightweight decorative background: floating math glyphs with randomized
// positions/delays. Pure CSS/Framer Motion, no heavy canvas/WebGL — keeps
// the hero fast on low-end Android devices common among Kenyan students.
export const MathBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {symbols.map((symbol, i) => {
        const left = (i * 8.3 + 5) % 100;
        const delay = (i % 6) * 0.7;
        const duration = 5 + (i % 4);
        const size = 24 + (i % 3) * 16;

        return (
          <motion.span
            key={`${symbol}-${i}`}
            className="absolute select-none font-display font-bold text-brand-500/10 dark:text-brand-300/10"
            style={{ left: `${left}%`, top: `${(i * 13) % 90}%`, fontSize: `${size}px` }}
            animate={{ y: [0, -24, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            {symbol}
          </motion.span>
        );
      })}
    </div>
  );
};
