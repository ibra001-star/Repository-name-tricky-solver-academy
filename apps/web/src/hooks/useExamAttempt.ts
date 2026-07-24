'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import { ExamAttempt } from '@/types';

const AUTOSAVE_INTERVAL_MS = 15_000;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Centralizes the exam attempt lifecycle: tracks answers locally for
// instant UI feedback, and periodically flushes any dirty answers to the
// autosave endpoint so a closed tab or dead battery never loses progress.
export const useExamAttempt = (attemptId: string | null) => {
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle');
  const dirtyQuestionIds = React.useRef<Set<string>>(new Set());
  const isSavingRef = React.useRef(false);
  const answersRef = React.useRef(answers);
  answersRef.current = answers;

  const setAnswer = React.useCallback((questionId: string, response: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: response }));
    dirtyQuestionIds.current.add(questionId);
  }, []);

  const flush = React.useCallback(async () => {
    if (!attemptId || isSavingRef.current || dirtyQuestionIds.current.size === 0) return;

    isSavingRef.current = true;
    setSaveStatus('saving');

    const idsToSave = Array.from(dirtyQuestionIds.current);
    dirtyQuestionIds.current.clear();

    try {
      // Save sequentially rather than in parallel to avoid overwhelming a
      // slow mobile connection with concurrent requests — acceptable
      // latency tradeoff since autosave isn't blocking the UI.
      for (const questionId of idsToSave) {
        await api.patch<ExamAttempt>(`/exams/attempts/${attemptId}/autosave`, {
          questionId,
          response: answersRef.current[questionId],
        });
      }
      setSaveStatus('saved');
    } catch {
      // Re-queue the failed IDs so the next flush retries them.
      idsToSave.forEach((id) => dirtyQuestionIds.current.add(id));
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [attemptId]);

  React.useEffect(() => {
    const interval = setInterval(flush, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [flush]);

  // Best-effort flush when the student navigates away or closes the tab.
  React.useEffect(() => {
    const handler = () => {
      if (dirtyQuestionIds.current.size > 0) void flush();
    };
    window.addEventListener('beforeunload', handler);
    window.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('visibilitychange', handler);
    };
  }, [flush]);

  const submit = React.useCallback(async () => {
    if (!attemptId) throw new Error('No active attempt');
    // Send whatever hasn't been autosaved yet along with the submit call,
    // to cover the race where the student submits between autosave ticks.
    return api.post<ExamAttempt>(`/exams/attempts/${attemptId}/submit`, { answers: answersRef.current });
  }, [attemptId]);

  return { answers, setAnswer, saveStatus, flush, submit };
};
