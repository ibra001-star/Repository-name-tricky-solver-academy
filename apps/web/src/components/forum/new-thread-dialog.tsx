'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { ForumThread } from '@/types';

interface NewThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (threadId: string) => void;
}

export const NewThreadDialog = ({ open, onOpenChange, onCreated }: NewThreadDialogProps) => {
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await api.post<{ thread: ForumThread & { id: string } }>('/forum/threads', { title, body });
      setTitle('');
      setBody('');
      onCreated(data.thread.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <Dialog.Title className="font-display text-lg font-semibold">Start a new discussion</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="thread-title">Title</Label>
              <Input
                id="thread-title"
                className="mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How do I approach compound interest questions?"
                required
              />
            </div>

            <div>
              <Label htmlFor="thread-body">Details</Label>
              <textarea
                id="thread-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                required
                placeholder="Share more context — what have you tried, where are you stuck?"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Post discussion
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
