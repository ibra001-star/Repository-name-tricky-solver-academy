'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Fatuma Ali',
    role: 'Form 4 Student, Mandera',
    quote:
      'The mock exams feel exactly like KCSE. I went from a C+ to a B in Mathematics after two months of consistent practice.',
    rating: 5,
  },
  {
    name: 'Joseph Kiptoo',
    role: 'Form 3 Student, Eldoret',
    quote:
      'I love that I can practice even when my internet is slow. The Business Studies case studies are exactly like what we see in exams.',
    rating: 5,
  },
  {
    name: 'Mr. Hassan Noor',
    role: 'Mathematics Teacher',
    quote:
      'Uploading revision papers and tracking my students’ weak topics has made my job so much easier. A great tool for Kenyan classrooms.',
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="bg-muted/30 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Loved by students and teachers</h2>
          <p className="mt-4 text-muted-foreground">Real results from real Kenyan classrooms.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex gap-1 text-gold-500">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
