'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { ExamTakingQuestion } from '@/types';
import { MathText } from './math-text';
import { cn } from '@/lib/utils';

interface QuestionRendererProps {
  question: ExamTakingQuestion;
  index: number;
  response: unknown;
  onChange: (response: unknown) => void;
  disabled?: boolean;
}

const isEssayLike = (type: string) =>
  type === 'STRUCTURED' || type === 'CALCULATION' || type === 'ESSAY' || type === 'GRAPH' || type === 'IMAGE_BASED';

// A single component that adapts its input UI based on question.type, so
// the exam-taking page doesn't need type-specific branching logic itself.
export const QuestionRenderer = ({ question, index, response, onChange, disabled }: QuestionRendererProps) => {
  const { content, type, marks } = question;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-base font-semibold">
          Question {index + 1}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({marks} mark{marks !== 1 ? 's' : ''})
          </span>
        </h3>
        {response !== undefined && response !== null && response !== '' && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Answered
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed">{content.text}</p>
      {content.latex && <MathText latex={content.latex} displayMode className="mt-3 block text-base" />}

      {content.imageUrls?.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt={`Diagram for question ${index + 1}`} className="mt-4 max-w-full rounded-lg border border-border" />
      ))}

      <div className="mt-5">
        {type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2" role="radiogroup" aria-label={`Answer options for question ${index + 1}`}>
            {content.options?.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted',
                  response === option.id && 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                )}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  className="h-4 w-4 accent-brand-500"
                  checked={response === option.id}
                  onChange={() => onChange(option.id)}
                  disabled={disabled}
                />
                {option.text}
              </label>
            ))}
          </div>
        )}

        {type === 'FILL_IN_BLANK' && (
          <div className="space-y-3">
            {(content.blanks ?? []).map((_, blankIndex) => {
              const answers = Array.isArray(response) ? (response as string[]) : [];
              return (
                <input
                  key={blankIndex}
                  type="text"
                  disabled={disabled}
                  value={answers[blankIndex] ?? ''}
                  onChange={(e) => {
                    const next = [...answers];
                    next[blankIndex] = e.target.value;
                    onChange(next);
                  }}
                  placeholder={`Blank ${blankIndex + 1}`}
                  className="flex h-11 w-full max-w-sm rounded-lg border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              );
            })}
          </div>
        )}

        {type === 'MATCHING' && (
          <div className="space-y-2">
            {(content.matchPairs ?? []).map((pair) => {
              const answers = (response ?? {}) as Record<string, string>;
              return (
                <div key={pair.left} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="w-full text-sm font-medium sm:w-40">{pair.left}</span>
                  <select
                    disabled={disabled}
                    value={answers[pair.left] ?? ''}
                    onChange={(e) => onChange({ ...answers, [pair.left]: e.target.value })}
                    className="h-11 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select a match</option>
                    {(content.matchPairs ?? []).map((p) => (
                      <option key={p.right} value={p.right}>
                        {p.right}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {isEssayLike(type) && (
          <textarea
            disabled={disabled}
            value={typeof response === 'string' ? response : ''}
            onChange={(e) => onChange(e.target.value)}
            rows={type === 'ESSAY' ? 10 : 5}
            placeholder="Show your working and write your final answer here..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
      </div>

      {isEssayLike(type) && (
        <p className="mt-2 text-xs text-muted-foreground">
          This question will be reviewed by a teacher — your score updates once marked.
        </p>
      )}
    </motion.div>
  );
};
