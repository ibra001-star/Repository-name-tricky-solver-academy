'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Gift, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { ReferralStats } from '@/types';

export default function ReferralsPage() {
  const { isReady } = useRequireAuth();
  const [code, setCode] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<ReferralStats | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isReady) return;
    api
      .get<{ referralCode: string }>('/referrals/code')
      .then((d) => setCode(d.referralCode))
      .catch(() => {});
    api
      .get<{ stats: ReferralStats }>('/referrals/stats')
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, [isReady]);

  const referralUrl = typeof window !== 'undefined' && code ? `${window.location.origin}/register?ref=${code}` : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600 dark:bg-gold-950/40">
          <Gift className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Invite friends, earn rewards</h1>
        <p className="mt-2 text-muted-foreground">
          Share your referral link. When someone you refer subscribes, you earn 7 bonus days of premium access.
        </p>
      </motion.div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        {code ? (
          <>
            <p className="text-sm font-medium">Your referral link</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={referralUrl}
                className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Your code: {code}</p>
          </>
        ) : (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          </div>
        )}
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="font-display text-3xl font-bold text-brand-500">{stats.totalReferred}</p>
            <p className="mt-1 text-sm text-muted-foreground">People referred</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="font-display text-3xl font-bold text-gold-500">{stats.rewardsEarned}</p>
            <p className="mt-1 text-sm text-muted-foreground">Rewards earned</p>
          </div>
        </div>
      )}
    </div>
  );
}
