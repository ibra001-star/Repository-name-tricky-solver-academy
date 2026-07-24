'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'Is Tricky Solver Academy aligned to the CBC curriculum?',
    a: 'Yes. Our question bank and mock exams cover both CBC Senior School pathways and the traditional KCSE syllabus, organized by form, topic, and difficulty.',
  },
  {
    q: 'Can I use the platform on a low-end phone or slow internet?',
    a: 'Absolutely. The platform is built mobile-first with lightweight pages, offline support for downloaded papers, and optimized images so it works well even on 2G/3G connections.',
  },
  {
    q: 'How do I pay for Premium if I don\u2019t have a credit card?',
    a: 'You can pay directly with M-Pesa STK Push using your phone number — no card needed. Stripe and PayPal are also available for international payments.',
  },
  {
    q: 'Can teachers upload their own revision papers?',
    a: 'Yes. Teachers can upload revision papers and marking schemes, which are reviewed and approved by our admin team before appearing in the question bank.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. You can create a free account and access a selection of practice questions and topical exams. Premium unlocks the full question bank, mock exams, and detailed analytics.',
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        </div>

        <div className="mx-auto mt-10 max-w-2xl divide-y divide-border rounded-2xl border border-border bg-card">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-muted-foreground">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
