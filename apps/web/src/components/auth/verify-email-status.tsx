'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

export const VerifyEmailStatus = () => {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = React.useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = React.useState(token ? '' : 'This verification link is missing its token.');
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // the token is single-use, so only call once
    api
      .post('/auth/verify-email', { token })
      .then(() => setState('ok'))
      .catch((err) => {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'We could not verify your email.');
      });
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        Verifying your email…
      </div>
    );
  }

  if (state === 'ok') {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-500" />
        <p className="text-sm text-muted-foreground">Your email is verified. You can now log in.</p>
        <Link href="/login" className="text-sm font-medium text-brand-500 hover:underline">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/login" className="text-sm font-medium text-brand-500 hover:underline">
        Back to log in
      </Link>
    </div>
  );
};
