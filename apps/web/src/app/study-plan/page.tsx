'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Check, Trash2, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { StudyPlanItem } from '@/types';
import { cn } from '@/lib/utils';

export default function StudyPlanPage() {
  const { isReady } = useRequireAuth();
  const [items, setItems] = React.useState<StudyPlanItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [title, setTitle] = React.useState('');
  const [scheduledFor, setScheduledFor] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchItems = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ items: StudyPlanItem[] }>('/study-plan');
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isReady) fetchItems();
  }, [isReady, fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledFor) return;
    setIsSubmitting(true);
    try {
      await api.post('/study-plan', { title, scheduledFor: new Date(scheduledFor).toISOString() });
      setTitle('');
      setScheduledFor('');
      await fetchItems();
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (item: StudyPlanItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i)));
    try {
      await api.patch(`/study-plan/${item.id}`, { isCompleted: !item.isCompleted });
    } catch {
      await fetchItems(); // revert on failure by re-syncing
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.delete(`/study-plan/${id}`);
    } catch {
      await fetchItems();
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Study Planner</h1>
        <p className="mt-1 text-muted-foreground">
          Build your own revision timetable and get reminded before each session.
        </p>
      </motion.div>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Label htmlFor="plan-title">What are you studying?</Label>
          <Input
            id="plan-title"
            className="mt-1.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Algebra revision"
            required
          />
        </div>
        <div>
          <Label htmlFor="plan-time">When</Label>
          <Input
            id="plan-time"
            type="datetime-local"
            className="mt-1.5"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            required
          />
        </div>
        <Button type="submit" isLoading={isSubmitting}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center text-muted-foreground">
          <CalendarClock className="h-10 w-10" />
          <p className="mt-3 text-sm">No study sessions planned yet. Add one above.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3',
                item.isCompleted && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleComplete(item)}
                  aria-label={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    item.isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-border'
                  )}
                >
                  {item.isCompleted && <Check className="h-3.5 w-3.5" />}
                </button>
                <div>
                  <p className={cn('text-sm font-medium', item.isCompleted && 'line-through')}>{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.scheduledFor).toLocaleString('en-KE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                aria-label="Delete"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
