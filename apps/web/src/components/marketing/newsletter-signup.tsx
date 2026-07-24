'use client';

import * as React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

export const NewsletterSignup = () => {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      await api.post('/newsletter/subscribe', { email });
      setStatus('success');
      setEmail('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" /> You&apos;re subscribed! Watch your inbox for updates.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:w-56"
      />
      <Button type="submit" size="sm" isLoading={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
      </Button>
      {error && <p className="text-xs text-destructive sm:ml-2 sm:self-center">{error}</p>}
    </form>
  );
};
