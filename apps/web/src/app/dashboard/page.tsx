'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList, TrendingUp, Award, Loader2, ArrowRight } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface AttemptSummary {
  id: string;
  examId: string;
  status: string;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  exam: { title: string; subject: { name: string } };
}

export default function DashboardPage() {
  const { user, isReady } = useRequireAuth();
  const [attempts, setAttempts] = React.useState<AttemptSummary[] | null>(null);

  React.useEffect(() => {
    if (!isReady) return;
    api
      .get<{ attempts: AttemptSummary[] }>('/exams/attempts/mine')
      .then((d) => setAttempts(d.attempts))
      .catch(() => setAttempts([]));
  }, [isReady]);

  if (!isReady || attempts === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const markedAttempts = attempts.filter((a) => a.status === 'MARKED' && a.percentage !== null);
  const averageScore =
    markedAttempts.length > 0
      ? Math.round(markedAttempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / markedAttempts.length)
      : null;

  const summaryCards = [
    {
      icon: BookOpen,
      label: 'Exams Attempted',
      value: String(attempts.length),
      hint: attempts.length === 0 ? 'Start practicing to see progress' : 'Across all subjects',
    },
    {
      icon: ClipboardList,
      label: 'Exams Completed',
      value: String(attempts.filter((a) => a.status === 'MARKED' || a.status === 'SUBMITTED').length),
      hint: 'Marked or awaiting review',
    },
    {
      icon: TrendingUp,
      label: 'Average Score',
      value: averageScore !== null ? `${averageScore}%` : '—',
      hint: averageScore !== null ? 'Across marked exams' : 'Complete an exam to see your average',
    },
    { icon: Award, label: 'Certificates Earned', value: '0', hint: 'Earn certificates by passing exams' },
  ];

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          Welcome back, {user?.firstName}
          {!user?.isEmailVerified && (
            <span className="ml-3 align-middle text-xs font-normal text-gold-600">
              (please verify your email)
            </span>
          )}
        </h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground">Here&apos;s an overview of your learning journey.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/study-plan" className="text-sm font-medium text-brand-500 hover:underline">
              Study planner →
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-brand-500 hover:underline">
              Leaderboard →
            </Link>
            <Link href="/referrals" className="text-sm font-medium text-brand-500 hover:underline">
              Invite friends →
            </Link>
            <Link href="/payments/history" className="text-sm font-medium text-brand-500 hover:underline">
              Payment history →
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-950">
              <card.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold">{card.value}</div>
            <div className="mt-1 text-sm font-medium">{card.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{card.hint}</div>
          </motion.div>
        ))}
      </div>

      {attempts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-semibold">No activity yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Browse the question bank or attempt a mock exam to start building your performance analytics.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/subjects">Browse subjects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/exams">Attempt an exam</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent attempts</h2>
            <Link href="/exams" className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:underline">
              Attempt another exam <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {attempts.slice(0, 8).map((attempt) => (
              <Link
                key={attempt.id}
                href={
                  attempt.status === 'IN_PROGRESS'
                    ? `/exams/${attempt.examId}/take`
                    : `/exams/${attempt.examId}/result/${attempt.id}`
                }
                className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{attempt.exam.title}</p>
                  <p className="text-xs text-muted-foreground">{attempt.exam.subject.name}</p>
                </div>
                <div className="text-right">
                  {attempt.status === 'IN_PROGRESS' ? (
                    <span className="text-xs font-medium text-gold-600">Resume</span>
                  ) : attempt.status === 'MARKED' ? (
                    <span className="font-display text-sm font-semibold">{attempt.percentage}%</span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">Pending review</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
