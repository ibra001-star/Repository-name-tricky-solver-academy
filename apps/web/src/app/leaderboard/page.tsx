'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Medal } from 'lucide-react';
import { api } from '@/lib/api';
import { PlatformLeaderboardEntry } from '@/types';
import { cn } from '@/lib/utils';

const rankStyles: Record<number, string> = {
  1: 'text-gold-500',
  2: 'text-slate-400',
  3: 'text-amber-700',
};

export default function LeaderboardPage() {
  const [entries, setEntries] = React.useState<PlatformLeaderboardEntry[] | null>(null);

  React.useEffect(() => {
    api
      .get<{ leaderboard: PlatformLeaderboardEntry[] }>('/exams/leaderboard')
      .then((d) => setEntries(d.leaderboard))
      .catch(() => setEntries([]));
  }, []);

  return (
    <div className="container max-w-2xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600 dark:bg-gold-950/40">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">
          Top students ranked by average score across all marked exams (minimum 3 exams completed).
        </p>
      </motion.div>

      {entries === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No one has completed enough exams to be ranked yet.
        </p>
      ) : (
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {entries.map((entry) => (
            <div key={entry.rank} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold',
                    entry.rank <= 3 ? rankStyles[entry.rank] : 'text-muted-foreground'
                  )}
                >
                  {entry.rank <= 3 ? <Medal className="h-5 w-5" /> : entry.rank}
                </span>
                <div>
                  <p className="font-medium">{entry.name}</p>
                  {entry.school && <p className="text-xs text-muted-foreground">{entry.school}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-semibold">{entry.averagePercentage}%</p>
                <p className="text-xs text-muted-foreground">{entry.examsCompleted} exams</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
