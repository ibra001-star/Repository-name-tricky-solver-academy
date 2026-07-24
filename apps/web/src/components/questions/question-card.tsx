'use client';

import * as React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Question } from '@/types';
import { MathText } from '@/components/exam/math-text';
import { api } from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { cn } from '@/lib/utils';

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  MEDIUM: 'bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-400',
  HARD: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

export const QuestionCard = ({ question }: { question: Question }) => {
  const { user } = useAuthStore();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);

  const handleBookmark = async () => {
    if (!user || isToggling) return;
    setIsToggling(true);
    try {
      const result = await api.post<{ bookmarked: boolean }>(`/questions/${question.id}/bookmark`);
      setIsBookmarked(result.bookmarked);
    } catch {
      // silently ignore — bookmarking is a non-critical convenience action
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', difficultyStyles[question.difficulty])}>
            {question.difficulty}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {question.topic?.name}
          </span>
          {question.form && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Form {question.form}
            </span>
          )}
        </div>
        {user && (
          <button
            onClick={handleBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
            className="text-muted-foreground hover:text-gold-500"
          >
            {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-gold-500" /> : <Bookmark className="h-5 w-5" />}
          </button>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed">{question.content.text}</p>
      {question.content.latex && <MathText latex={question.content.latex} displayMode className="mt-2 block" />}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {question.marks} mark{question.marks !== 1 ? 's' : ''}
        </span>
        {question.year && <span>{question.year}</span>}
      </div>
    </div>
  );
};
