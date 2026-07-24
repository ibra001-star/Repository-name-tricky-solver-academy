'use client';

import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubscriptionPlan } from '@/types';

const PLAN_PRICES_KES: Record<SubscriptionPlan, number> = {
  MONTHLY: 300,
  YEARLY: 2500,
  LIFETIME: 6000,
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
  LIFETIME: 'Lifetime',
};

const PLAN_PERIODS: Record<SubscriptionPlan, string> = {
  MONTHLY: '/month',
  YEARLY: '/year',
  LIFETIME: 'one-time',
};

const FEATURES = [
  'Full access to the question bank',
  'Unlimited mock exams and past papers',
  'Detailed performance analytics',
  'Downloadable marking schemes',
  'Priority support',
];

interface PlanCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
}

export const PlanCard = ({ plan, isPopular, onSelect, isLoading }: PlanCardProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-6',
        isPopular ? 'border-gold-500 bg-gold-50/40 shadow-md dark:bg-gold-950/10' : 'border-border bg-card'
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-brand-950">
          Best value
        </span>
      )}

      <div className="flex items-center gap-2">
        {plan === 'LIFETIME' && <Crown className="h-5 w-5 text-gold-500" />}
        <h3 className="font-display text-lg font-semibold">{PLAN_LABELS[plan]}</h3>
      </div>

      <div className="mt-3">
        <span className="font-display text-3xl font-bold">KES {PLAN_PRICES_KES[plan].toLocaleString()}</span>
        <span className="ml-1 text-sm text-muted-foreground">{PLAN_PERIODS[plan]}</span>
      </div>

      <ul className="mt-5 space-y-2.5 text-sm">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className="mt-6"
        variant={isPopular ? 'gold' : 'default'}
        onClick={() => onSelect(plan)}
        isLoading={isLoading}
      >
        Choose {PLAN_LABELS[plan]}
      </Button>
    </div>
  );
};
