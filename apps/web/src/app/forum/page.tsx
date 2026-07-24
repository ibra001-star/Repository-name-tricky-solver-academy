'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Pin, Lock, Loader2, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewThreadDialog } from '@/components/forum/new-thread-dialog';
import { useAuthStore } from '@/hooks/useAuthStore';
import { api } from '@/lib/api';
import { ForumThread } from '@/types';

export default function ForumPage() {
  const { user } = useAuthStore();
  const [threads, setThreads] = React.useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const fetchThreads = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ threads: ForumThread[] }>('/forum/threads');
      setThreads(data.threads);
    } catch {
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <div className="container max-w-3xl py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Student Forum</h1>
          <p className="mt-1 text-muted-foreground">Ask questions, help classmates, and discuss revision topics.</p>
        </div>
        {user && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New thread
          </Button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : threads.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No discussions yet. Be the first to start one!
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/${thread.id}`}
              className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {thread.isPinned && <Pin className="h-3.5 w-3.5 shrink-0 text-gold-500" />}
                  {thread.isLocked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <p className="truncate font-medium">{thread.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  by {thread.author.firstName} {thread.author.lastName}
                  {thread.subject ? ` · ${thread.subject.name}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {thread._count?.posts ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {thread.viewCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewThreadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(threadId) => {
          setDialogOpen(false);
          window.location.href = `/forum/${threadId}`;
        }}
      />
    </div>
  );
}
