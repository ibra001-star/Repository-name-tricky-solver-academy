'use client';

import { cn } from '@/lib/utils';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onNavigate: (index: number) => void;
}

export const QuestionNavigator = ({
  totalQuestions,
  currentIndex,
  answeredIndices,
  onNavigate,
}: QuestionNavigatorProps) => {
  return (
    <nav aria-label="Question navigator" className="rounded-2xl border border-border bg-card p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Questions ({answeredIndices.size}/{totalQuestions} answered)
      </h4>
      <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            aria-label={`Go to question ${i + 1}${answeredIndices.has(i) ? ', answered' : ', not answered'}`}
            aria-current={currentIndex === i ? 'true' : undefined}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
              currentIndex === i
                ? 'bg-brand-500 text-white'
                : answeredIndices.has(i)
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-brand-500" /> Current
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-100 dark:bg-green-950/50" /> Answered
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-muted" /> Not answered
        </div>
      </div>
    </nav>
  );
};
