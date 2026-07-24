'use client';

import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

const stats = [
  { label: 'Active Students', value: 12400, suffix: '+' },
  { label: 'Practice Questions', value: 8500, suffix: '+' },
  { label: 'Mock Exams Completed', value: 45000, suffix: '+' },
  { label: 'Pass Rate Improvement', value: 27, suffix: '%' },
];

const Counter = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000, bounce: 0 });

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = Math.round(latest).toLocaleString() + suffix;
    });
  }, [springValue, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

export const Stats = () => {
  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-3xl font-bold text-brand-500 md:text-4xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
