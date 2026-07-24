'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Calculator, Briefcase, FlaskConical, Dna, MonitorCog, Atom } from 'lucide-react';
import { api } from '@/lib/api';
import { Subject } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mathematics: Calculator,
  'business-studies': Briefcase,
  chemistry: FlaskConical,
  biology: Dna,
  'computer-studies': MonitorCog,
  physics: Atom,
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = React.useState<Subject[] | null>(null);

  React.useEffect(() => {
    api
      .get<{ subjects: Subject[] }>('/subjects')
      .then((d) => setSubjects(d.subjects))
      .catch(() => setSubjects([]));
  }, []);

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Subjects</h1>
        <p className="mt-1 text-muted-foreground">Starting with Mathematics and Business Studies.</p>
      </motion.div>

      {subjects === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const Icon = iconMap[subject.slug] ?? Calculator;
            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-950">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{subject.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{subject.description}</p>
                  {subject._count && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {subject._count.questions} questions · {subject._count.exams} exams
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-500 transition-all group-hover:gap-2">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
