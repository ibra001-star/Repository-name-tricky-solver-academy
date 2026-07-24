'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api, ApiError } from '@/lib/api';
import { Payment } from '@/types';

// PayPal redirects back here with ?token=<orderId> after the customer
// approves the payment on PayPal's site. We still need to explicitly
// capture the order server-side to actually collect the funds.
function PaypalReturnContent() {
  const { isReady } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('token');
  const paymentId = searchParams.get('payment_id');

  const [status, setStatus] = React.useState<'capturing' | 'success' | 'error'>('capturing');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isReady || !orderId || !paymentId) return;
    let cancelled = false;

    (async () => {
      try {
        await api.post<{ payment: Payment }>('/payments/paypal/capture', { orderId, paymentId });
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to complete the PayPal payment.');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, orderId, paymentId]);

  if (!isReady || !orderId || !paymentId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-14">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-2xl border border-border bg-card p-8 text-center"
      >
        {status === 'capturing' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500" />
            <h1 className="mt-4 font-display text-xl font-bold">Finalizing your PayPal payment...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold">Payment successful!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Your premium access is now active.</p>
            <Button className="mt-6" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold">Payment could not be completed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-6" variant="outline" onClick={() => router.push('/pricing')}>
              Back to pricing
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaypalReturnPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <PaypalReturnContent />
    </React.Suspense>
  );
}
