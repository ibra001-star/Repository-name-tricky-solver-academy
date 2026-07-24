'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Receipt, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Payment } from '@/types';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  SUCCESS: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-400' },
  PENDING: { icon: Clock, className: 'text-gold-600 dark:text-gold-400' },
  FAILED: { icon: XCircle, className: 'text-destructive' },
  REFUNDED: { icon: Receipt, className: 'text-muted-foreground' },
};

const providerLabels: Record<string, string> = { MPESA: 'M-Pesa', STRIPE: 'Card', PAYPAL: 'PayPal' };

export default function PaymentHistoryPage() {
  const { isReady } = useRequireAuth();
  const [payments, setPayments] = React.useState<Payment[] | null>(null);

  React.useEffect(() => {
    if (!isReady) return;
    api
      .get<{ payments: Payment[] }>('/payments/mine')
      .then((d) => setPayments(d.payments))
      .catch(() => setPayments([]));
  }, [isReady]);

  if (!isReady || payments === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Payment history</h1>
        <p className="mt-1 text-muted-foreground">All your subscriptions and paper purchases.</p>
      </motion.div>

      {payments.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-semibold">No payments yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Your subscription and paper purchase history will appear here.
          </p>
          <Link href="/pricing" className="mt-4 inline-block text-sm font-medium text-brand-500 hover:underline">
            View pricing plans →
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {payments.map((payment) => {
            const style = statusStyles[payment.status];
            const Icon = style.icon;
            const label =
              payment.purpose === 'SUBSCRIPTION'
                ? `${payment.subscription?.plan ?? ''} Subscription`.trim()
                : payment.paperPurchase?.exam.title ?? 'Paper purchase';

            return (
              <div key={payment.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-5 w-5 shrink-0', style.className)} />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {providerLabels[payment.provider] ?? payment.provider} ·{' '}
                      {new Date(payment.createdAt).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-semibold">KES {payment.amountKes.toLocaleString()}</p>
                  <p className={cn('text-xs font-medium', style.className)}>{payment.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
