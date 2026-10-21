'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';

export const ForgotPasswordForm = () => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-brand-500" />
        <p className="text-sm text-muted-foreground">
          If an account exists for <strong>{email}</strong>, we have sent a link to reset your password. Check your inbox
          and spam folder.
        </p>
        <Link href="/login" className="text-sm font-medium text-brand-500 hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          className="mt-1.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" isLoading={loading} disabled={!email}>
        Send reset link
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-brand-500 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
};
