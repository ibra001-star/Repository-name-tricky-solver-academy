'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Video, Youtube, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { LiveClass } from '@/types';
import { cn } from '@/lib/utils';

export default function LiveClassesPage() {
  const [classes, setClasses] = React.useState<LiveClass[] | null>(null);

  React.useEffect(() => {
    api
      .get<{ classes: LiveClass[] }>('/live-classes')
      .then((d) => setClasses(d.classes))
      .catch(() => setClasses([]));
  }, []);

  return (
    <div className="container max-w-3xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Live Classes</h1>
        <p className="mt-1 text-muted-foreground">Join live Zoom sessions or watch recorded lesson videos.</p>
      </motion.div>

      {classes === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : classes.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No live classes scheduled right now.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {classes.map((liveClass) => {
            const Icon = liveClass.type === 'ZOOM' ? Video : Youtube;
            return (
              <div
                key={liveClass.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      liveClass.type === 'ZOOM'
                        ? 'bg-brand-50 text-brand-500 dark:bg-brand-950'
                        : 'bg-red-50 text-red-600 dark:bg-red-950/40'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{liveClass.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {liveClass.subject?.name ?? 'All subjects'} · Hosted by {liveClass.host.firstName}{' '}
                      {liveClass.host.lastName}
                    </p>
                    {liveClass.scheduledStart && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(liveClass.scheduledStart).toLocaleString('en-KE', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {liveClass.durationMinutes ? ` · ${liveClass.durationMinutes} min` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <Button asChild size="sm">
                  <a href={liveClass.joinUrl} target="_blank" rel="noopener noreferrer">
                    {liveClass.type === 'ZOOM' ? 'Join' : 'Watch'} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
