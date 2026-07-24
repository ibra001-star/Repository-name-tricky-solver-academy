'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlanCard } from '@/components/payments/plan-card';
import { CheckoutDialog } from '@/components/payments/checkout-dialog';
import { useAuthStore } from '@/hooks/useAuthStore';
import { api } from '@/lib/api';
import { SubscriptionPlan, InitiatePaymentResponse, PaymentProviderName } from '@/types';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleInitiate = async (
    provider: PaymentProviderName,
    phone: string | undefined,
    couponCode: string | undefined
  ): Promise<InitiatePaymentResponse> => {
    if (!selectedPlan) throw new Error('No plan selected');
    return api.post<InitiatePaymentResponse>('/payments/subscriptions', {
      plan: selectedPlan,
      provider,
      phone,
      couponCode,
    });
  };

  return (
    <div className="container py-14">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h1 className="font-display text-3xl font-bold md:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-4 text-muted-foreground">
          Unlock the full question bank, unlimited mock exams, and detailed analytics. Pay with M-Pesa, card, or
          PayPal.
        </p>
      </motion.div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        <PlanCard plan="MONTHLY" onSelect={handleSelectPlan} isLoading={false} />
        <PlanCard plan="YEARLY" isPopular onSelect={handleSelectPlan} isLoading={false} />
        <PlanCard plan="LIFETIME" onSelect={handleSelectPlan} isLoading={false} />
      </div>

      {selectedPlan && (
        <CheckoutDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={`${selectedPlan.charAt(0)}${selectedPlan.slice(1).toLowerCase()} Subscription`}
          amountLabel="Complete your payment to activate premium access"
          onInitiate={handleInitiate}
        />
      )}
    </div>
  );
}
