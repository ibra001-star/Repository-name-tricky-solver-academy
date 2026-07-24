'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, UserCheck, BookOpen, ClipboardList, FileClock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PlatformStats } from '@/types';

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState<PlatformStats | null>(null);

  React.useEffect(() => {
    api
      .get<{ stats: PlatformStats }>('/admin/stats')
      .then((d) => setStats(d.stats))
      .catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  const cards = [
    { icon: GraduationCap, label: 'Students', value: stats.totalStudents },
    { icon: UserCheck, label: 'Teachers', value: stats.totalTeachers },
    { icon: BookOpen, label: 'Approved Questions', value: stats.totalQuestions },
    { icon: FileClock, label: 'Questions Pending Review', value: stats.pendingQuestions },
    { icon: ClipboardList, label: 'Published Exams', value: stats.totalExams },
    { icon: ClipboardList, label: 'Total Attempts', value: stats.totalAttempts },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-950">
            <card.icon className="h-5 w-5" />
          </div>
          <div className="mt-3 font-display text-2xl font-bold">{card.value.toLocaleString()}</div>
          <div className="mt-1 text-sm text-muted-foreground">{card.label}</div>
        </motion.div>
      ))}

      {stats.pendingUploads > 0 && (
        <div className="col-span-full rounded-2xl border border-gold-500/30 bg-gold-50 p-5 text-sm text-gold-700 dark:bg-gold-950/20 dark:text-gold-400">
          {stats.pendingUploads} teacher upload{stats.pendingUploads !== 1 ? 's' : ''} awaiting review — see{' '}
          <a href="/admin/uploads" className="font-medium underline">
            Upload Approvals
          </a>
          .
        </div>
      )}
    </div>
  );
}
