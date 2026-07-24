'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancelledPage() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-14">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-2xl border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold">Payment cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You cancelled the payment before it was completed. No charge was made.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/pricing">Back to pricing</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
