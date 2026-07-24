'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Pin, Lock, ShieldCheck, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { api, ApiError } from '@/lib/api';
import { ForumThreadDetail } from '@/types';
import { cn } from '@/lib/utils';

const roleBadge = (role: string) => {
  if (role === 'TEACHER')
    return { icon: GraduationCap, label: 'Teacher', className: 'text-green-600 dark:text-green-400' };
  if (role === 'ADMIN' || role === 'SUPER_ADMIN')
    return { icon: ShieldCheck, label: 'Admin', className: 'text-gold-600 dark:text-gold-400' };
  return null;
};

export default function ForumThreadPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [thread, setThread] = React.useState<ForumThreadDetail | null>(null);
  const [reply, setReply] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchThread = React.useCallback(async () => {
    try {
      const data = await api.get<{ thread: ForumThreadDetail }>(`/forum/threads/${params.id}`);
      setThread(data.thread);
    } catch {
      setThread(null);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post(`/forum/threads/${params.id}/posts`, { body: reply });
      setReply('');
      await fetchThread();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to post your reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (thread === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-2">
          {thread.isPinned && <Pin className="h-4 w-4 text-gold-500" />}
          {thread.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
          <h1 className="font-display text-xl font-bold">{thread.title}</h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          by {thread.author.firstName} {thread.author.lastName}
          {thread.subject ? ` · ${thread.subject.name}` : ''} ·{' '}
          {new Date(thread.createdAt).toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{thread.body}</p>
      </motion.div>

      <h2 className="mt-8 font-display text-lg font-semibold">
        {thread.posts.length} {thread.posts.length === 1 ? 'reply' : 'replies'}
      </h2>

      <div className="mt-4 space-y-4">
        {thread.posts.map((post) => {
          const badge = roleBadge(post.author.role);
          return (
            <div key={post.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {post.author.firstName} {post.author.lastName}
                </span>
                {badge && (
                  <span className={cn('flex items-center gap-1 text-xs font-medium', badge.className)}>
                    <badge.icon className="h-3.5 w-3.5" /> {badge.label}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
            </div>
          );
        })}
      </div>

      {thread.isLocked ? (
        <p className="mt-6 rounded-lg bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          This thread is locked and no longer accepting replies.
        </p>
      ) : user ? (
        <form onSubmit={handleReply} className="mt-6 space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            required
            placeholder="Write a reply..."
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" isLoading={isSubmitting}>
            Post reply
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <a href="/login" className="font-medium text-brand-500 hover:underline">
            Log in
          </a>{' '}
          to reply to this thread.
        </p>
      )}
    </div>
  );
}
