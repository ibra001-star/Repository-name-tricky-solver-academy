'use client';

import { motion } from 'framer-motion';
import { Calculator, ClipboardCheck, TrendingUp, Award, Smartphone, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Rich Question Bank',
    description: 'Topical, past-paper, and CBC-aligned questions with LaTeX equations, graphs, and diagrams.',
  },
  {
    icon: ClipboardCheck,
    title: 'Realistic Exam Engine',
    description: 'Timed mock exams with autosave, instant marking, and detailed step-by-step solutions.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Track your progress, discover weak topics, and follow a personalized study plan.',
  },
  {
    icon: Award,
    title: 'Certificates & Leaderboards',
    description: 'Earn certificates for completed exams and compete with classmates nationwide.',
  },
  {
    icon: Smartphone,
    title: 'Works on Any Device',
    description: 'Fast, mobile-first design that works smoothly even on low-end phones and slow connections.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description: 'Bank-level security for your data and payments, with M-Pesa, Stripe, and PayPal support.',
  },
];

export const Features = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need to excel</h2>
          <p className="mt-4 text-muted-foreground">
            A complete revision toolkit designed around the CBC and KCSE curricula.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-950">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
