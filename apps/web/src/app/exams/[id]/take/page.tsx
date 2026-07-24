'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CloudUpload, CheckCircle2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExamTimer } from '@/components/exam/exam-timer';
import { QuestionNavigator } from '@/components/exam/question-navigator';
import { QuestionRenderer } from '@/components/exam/question-renderer';
import { SubmitConfirmDialog } from '@/components/exam/submit-confirm-dialog';
import { CheckoutDialog } from '@/components/payments/checkout-dialog';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useExamAttempt } from '@/hooks/useExamAttempt';
import { api, ApiError } from '@/lib/api';
import { ExamForTaking, ExamAttempt, InitiatePaymentResponse, PaymentProviderName } from '@/types';

export default function TakeExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isReady } = useRequireAuth();

  const [exam, setExam] = React.useState<ExamForTaking | null>(null);
  const [attempt, setAttempt] = React.useState<ExamAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { answers, setAnswer, saveStatus, flush, submit } = useExamAttempt(attempt?.id ?? null);

  // Load the exam + start (or resume) the attempt once auth is confirmed.
  React.useEffect(() => {
    if (!isReady) return;
    let cancelled = false;

    (async () => {
      try {
        const [examData, attemptData] = await Promise.all([
          api.get<{ exam: ExamForTaking }>(`/exams/${params.id}/take`),
          api.post<{ attempt: ExamAttempt }>(`/exams/${params.id}/attempts`),
        ]);
        if (cancelled) return;
        setExam(examData.exam);
        setAttempt(attemptData.attempt);

        // Hydrate any previously autosaved answers (resume-in-progress).
        const previousAnswers = attemptData.attempt.answers ?? {};
        for (const [questionId, entry] of Object.entries(previousAnswers)) {
          setAnswer(questionId, entry.response);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.code === 'PAYMENT_REQUIRED') {
            setPaymentRequired(true);
          } else {
            setLoadError(err instanceof ApiError ? err.message : 'Failed to load this exam. Please try again.');
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, params.id]);

  const handleInitiatePurchase = async (
    provider: PaymentProviderName,
    phone: string | undefined,
    couponCode: string | undefined
  ): Promise<InitiatePaymentResponse> => {
    return api.post<InitiatePaymentResponse>('/payments/papers', {
      examId: params.id,
      provider,
      phone,
      couponCode,
    });
  };

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    try {
      await flush();
      const result = await submit();
      router.push(`/exams/${params.id}/result/${result.id}`);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to submit your exam. Please try again.');
      setIsSubmitting(false);
    }
  }, [flush, submit, router, params.id]);

  const handleTimeExpire = React.useCallback(() => {
    // Auto-submit when time runs out — no confirmation dialog, since the
    // deadline has already passed.
    void handleSubmit();
  }, [handleSubmit]);

  if (!isReady || (!exam && !loadError && !paymentRequired)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (paymentRequired) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600 dark:bg-gold-950/40">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold">This is a premium paper</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Subscribe to Tricky Solver Academy or purchase this paper individually to unlock it.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.push('/pricing')}>
            View subscription plans
          </Button>
          <Button onClick={() => setCheckoutOpen(true)}>Buy this paper</Button>
        </div>
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          title="Unlock this paper"
          amountLabel="One-time purchase for this exam only"
          onInitiate={handleInitiatePurchase}
        />
      </div>
    );
  }

  if (loadError && !exam) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-xl font-semibold">Couldn&apos;t start this exam</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{loadError}</p>
        <Button className="mt-6" onClick={() => router.push('/exams')}>
          Back to exams
        </Button>
      </div>
    );
  }


  if (!exam || !attempt) return null;

  const currentQuestion = exam.questions[currentIndex];
  const answeredIndices = new Set(
    exam.questions
      .map((q, i) => (answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '' ? i : -1))
      .filter((i) => i !== -1)
  );

  const deadline = new Date(attempt.startedAt).getTime() + exam.durationMinutes * 60 * 1000;

  return (
    <div className="container py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            {exam.subject.name} · {exam.totalMarks} marks · {exam.questions.length} questions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Saved
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <CloudUpload className="h-3.5 w-3.5 text-destructive" /> Retry pending
              </>
            )}
          </span>
          <ExamTimer deadline={deadline} onExpire={handleTimeExpire} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <QuestionRenderer
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentIndex}
            response={answers[currentQuestion.id]}
            onChange={(response) => setAnswer(currentQuestion.id, response)}
          />

          <div className="mt-5 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            {currentIndex === exam.questions.length - 1 ? (
              <Button onClick={() => setShowSubmitDialog(true)}>Submit exam</Button>
            ) : (
              <Button onClick={() => setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <QuestionNavigator
            totalQuestions={exam.questions.length}
            currentIndex={currentIndex}
            answeredIndices={answeredIndices}
            onNavigate={setCurrentIndex}
          />
          <Button variant="gold" className="w-full" onClick={() => setShowSubmitDialog(true)}>
            Submit exam
          </Button>
        </div>
      </div>

      <SubmitConfirmDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        unansweredCount={exam.questions.length - answeredIndices.size}
        onConfirm={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
