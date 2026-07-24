'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Trophy, CheckCircle2, XCircle, HelpCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/exam/math-text';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api, ApiError } from '@/lib/api';
import { AttemptResult, Certificate } from '@/types';
import { cn } from '@/lib/utils';

const gradeColor = (percentage: number) => {
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 50) return 'text-gold-600 dark:text-gold-400';
  return 'text-destructive';
};

export default function ExamResultPage() {
  const params = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();
  const { isReady } = useRequireAuth();

  const [result, setResult] = React.useState<AttemptResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = React.useState(false);

  const handleDownloadCertificate = async () => {
    setIsGeneratingCertificate(true);
    try {
      const data = await api.get<{ certificate: Certificate }>(`/certificates/${params.attemptId}`);
      window.open(data.certificate.fileUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // A toast system would surface this in production; the button simply
      // stops loading so the person can try again.
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  React.useEffect(() => {
    if (!isReady) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await api.get<{ result: AttemptResult }>(`/exams/attempts/${params.attemptId}/result`);
        if (!cancelled) setResult(data.result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load your result.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, params.attemptId]);

  if (!isReady || (!result && !error)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-xl font-semibold">Couldn&apos;t load this result</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => router.push('/exams')}>
          Back to exams
        </Button>
      </div>
    );
  }

  const percentage = result.percentage ?? 0;
  const hasUngraded = result.status === 'SUBMITTED';

  return (
    <div className="container max-w-3xl py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50 text-gold-600 dark:bg-gold-950/40">
          <Trophy className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">{result.exam.title}</h1>
        <p className="text-sm text-muted-foreground">{result.exam.subject.name}</p>

        <div className={cn('mt-6 font-display text-5xl font-bold', gradeColor(percentage))}>
          {percentage.toFixed(0)}%
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.score} / {result.totalMarks} marks
        </p>

        {hasUngraded && (
          <p className="mx-auto mt-4 max-w-sm rounded-lg bg-gold-50 px-4 py-3 text-xs text-gold-700 dark:bg-gold-950/30 dark:text-gold-400">
            Some questions in this exam need teacher review before your final score is confirmed.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {result.status === 'MARKED' && percentage >= 50 && (
            <Button onClick={handleDownloadCertificate} isLoading={isGeneratingCertificate} variant="gold">
              <Award className="h-4 w-4" /> Download certificate
            </Button>
          )}
          <Button asChild variant="outline">
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </motion.div>

      <h2 className="mt-10 font-display text-lg font-semibold">Question breakdown</h2>
      <div className="mt-4 space-y-4">
        {result.questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-sm font-semibold">
                Question {i + 1} <span className="font-normal text-muted-foreground">({q.marks} marks)</span>
              </h3>
              {q.isCorrect === true && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
              {q.isCorrect === false && <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
              {q.isCorrect === null && <HelpCircle className="h-5 w-5 shrink-0 text-muted-foreground" />}
            </div>

            <p className="mt-2 text-sm">{q.content.text}</p>
            {q.content.latex && <MathText latex={q.content.latex} displayMode className="mt-2 block" />}

            <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium">Your answer</p>
              <p className="mt-1 text-muted-foreground">
                {typeof q.studentAnswer === 'string' || typeof q.studentAnswer === 'number'
                  ? String(q.studentAnswer)
                  : q.studentAnswer
                    ? JSON.stringify(q.studentAnswer)
                    : 'Not answered'}
              </p>
            </div>

            <div className="mt-3 rounded-lg bg-brand-50 p-4 text-sm dark:bg-brand-950/30">
              <p className="font-medium text-brand-700 dark:text-brand-300">Solution</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-brand-900 dark:text-brand-200">
                {q.solution.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold text-brand-700 dark:text-brand-300">
                Final answer: {q.solution.finalAnswer}
              </p>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Awarded: {q.awarded} / {q.marks} marks
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
