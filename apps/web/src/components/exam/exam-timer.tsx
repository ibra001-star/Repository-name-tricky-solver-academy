'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  deadline: number; // epoch ms
  onExpire: () => void;
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

// Ticks every second against a fixed deadline (not a decrementing counter),
// so the timer stays accurate even if the tab is backgrounded and setInterval
// throttles — recomputing from Date.now() vs deadline avoids drift.
export const ExamTimer = ({ deadline, onExpire }: ExamTimerProps) => {
  const [remaining, setRemaining] = React.useState(() => deadline - Date.now());
  const hasExpiredRef = React.useRef(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const next = deadline - Date.now();
      setRemaining(next);
      if (next <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const isUrgent = remaining < 5 * 60 * 1000; // under 5 minutes
  const isCritical = remaining < 60 * 1000; // under 1 minute

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition-colors',
        isCritical
          ? 'animate-pulse border-destructive/40 bg-destructive/10 text-destructive'
          : isUrgent
            ? 'border-gold-500/40 bg-gold-50 text-gold-700 dark:bg-gold-950/30 dark:text-gold-400'
            : 'border-border bg-muted/50 text-foreground'
      )}
      role="timer"
      aria-live="polite"
    >
      <Clock className="h-4 w-4" />
      {formatTime(remaining)}
    </div>
  );
};
