'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { RevenueSummary } from '@/types';

export default function AdminRevenuePage() {
  const [summary, setSummary] = React.useState<RevenueSummary | null>(null);

  React.useEffect(() => {
    api
      .get<{ summary: RevenueSummary }>('/admin/revenue')
      .then((d) => setSummary(d.summary))
      .catch(() => setSummary(null));
  }, []);

  if (!summary) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Total revenue</p>
        <p className="mt-1 font-display text-4xl font-bold text-brand-500">
          KES {summary.totalRevenueKes.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{summary.totalTransactions} successful transactions</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold">By payment method</h3>
          <div className="mt-3 space-y-2">
            {summary.byProvider.map((p) => (
              <div key={p.provider} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.provider}</span>
                <span className="font-medium">
                  KES {p.revenueKes.toLocaleString()} ({p.count})
                </span>
              </div>
            ))}
            {summary.byProvider.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold">By purpose</h3>
          <div className="mt-3 space-y-2">
            {summary.byPurpose.map((p) => (
              <div key={p.purpose} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.purpose.replace('_', ' ')}</span>
                <span className="font-medium">
                  KES {p.revenueKes.toLocaleString()} ({p.count})
                </span>
              </div>
            ))}
            {summary.byPurpose.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-sm font-semibold">Recent payments</h3>
        <div className="mt-3 divide-y divide-border">
          {summary.recentPayments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium">
                  {p.user.firstName} {p.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.provider} ·{' '}
                  {new Date(p.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <span className="font-display font-semibold">KES {p.amountKes.toLocaleString()}</span>
            </div>
          ))}
          {summary.recentPayments.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">No payments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
