'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Payment } from '@/types';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~1 minute of polling

function PaymentSuccessContent() {
  const { isReady } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('payment_id');

  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [attempts, setAttempts] = React.useState(0);

  React.useEffect(() => {
    if (!isReady || !paymentId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.get<{ payment: Payment }>(`/payments/${paymentId}/status`);
        if (cancelled) return;
        setPayment(data.payment);
      } catch {
        // keep polling on transient errors
      }
    };

    poll();
    const interval = setInterval(() => {
      setAttempts((a) => a + 1);
      poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isReady, paymentId]);

  if (!isReady || !paymentId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const isSuccess = payment?.status === 'SUCCESS';
  const isFailed = payment?.status === 'FAILED';
  const isPending = !payment || payment.status === 'PENDING';
  const gaveUpPolling = isPending && attempts >= MAX_POLL_ATTEMPTS;

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-14">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-2xl border border-border bg-card p-8 text-center"
      >
        {isSuccess && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/40">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold">Payment successful!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your premium access is now active. Enjoy full access to Tricky Solver Academy.
            </p>
            <Button className="mt-6" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </Button>
          </>
        )}

        {isFailed && (
          <>
            <h1 className="font-display text-xl font-bold">Payment did not go through</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment could not be completed. No charge was made. Please try again.
            </p>
            <Button className="mt-6" onClick={() => router.push('/pricing')}>
              Try again
            </Button>
          </>
        )}

        {isPending && !gaveUpPolling && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50 text-gold-600 dark:bg-gold-950/40">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold">Confirming your payment...</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This usually takes a few seconds. Please don&apos;t close this page.
            </p>
          </>
        )}

        {gaveUpPolling && (
          <>
            <h1 className="font-display text-xl font-bold">Still processing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment is taking longer than expected to confirm. Check your payment history in a few minutes, or
              contact support if this persists.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </React.Suspense>
  );
}
