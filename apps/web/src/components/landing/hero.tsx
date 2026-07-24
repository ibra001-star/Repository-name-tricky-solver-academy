'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MathBackground } from '@/components/layout/math-background';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-background dark:from-brand-950 dark:to-background">
      <MathBackground />
      <div className="container relative py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-50 px-4 py-1.5 text-sm font-medium text-gold-700 dark:bg-gold-950/30 dark:text-gold-400"
          >
            <Crown className="h-4 w-4" />
            Built for CBC Senior School &amp; KCSE
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-balance font-display text-4xl font-bold tracking-tight md:text-6xl"
          >
            Master Mathematics.<br />
            <span className="text-brand-500">Excel in Business Studies.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground"
          >
            Practice questions, timed mock exams, and expert-marked revision papers —
            built for Kenyan secondary school students, from Form 1 to KCSE.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg">
              <Link href="/register">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/exams">
                <PlayCircle className="h-4 w-4" /> Attempt Exams
              </Link>
            </Button>
            <Button asChild size="lg" variant="gold">
              <Link href="/pricing">
                <Crown className="h-4 w-4" /> Buy Premium
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
