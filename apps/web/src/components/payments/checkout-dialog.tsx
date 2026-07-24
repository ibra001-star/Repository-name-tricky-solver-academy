'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Smartphone, CreditCard, Wallet, Loader2, AlertCircle, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { PaymentProviderName, InitiatePaymentResponse } from '@/types';
import { cn } from '@/lib/utils';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  amountLabel: string;
  onInitiate: (
    provider: PaymentProviderName,
    phone: string | undefined,
    couponCode: string | undefined
  ) => Promise<InitiatePaymentResponse>;
}

const PROVIDERS: { id: PaymentProviderName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'MPESA', label: 'M-Pesa', icon: Smartphone },
  { id: 'STRIPE', label: 'Card (Stripe)', icon: CreditCard },
  { id: 'PAYPAL', label: 'PayPal', icon: Wallet },
];

export const CheckoutDialog = ({ open, onOpenChange, title, amountLabel, onInitiate }: CheckoutDialogProps) => {
  const [provider, setProvider] = React.useState<PaymentProviderName>('MPESA');
  const [phone, setPhone] = React.useState('');
  const [couponCode, setCouponCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mpesaMessage, setMpesaMessage] = React.useState<string | null>(null);

  const handlePay = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onInitiate(provider, provider === 'MPESA' ? phone : undefined, couponCode || undefined);

      if (result.method === 'mpesa') {
        setMpesaMessage(result.customerMessage ?? 'Check your phone to complete the M-Pesa payment.');
      } else if (result.method === 'stripe' && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.method === 'paypal' && result.approveUrl) {
        window.location.href = result.approveUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setError(null);
    setMpesaMessage(null);
    setPhone('');
    setCouponCode('');
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-lg font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">{amountLabel}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {mpesaMessage ? (
            <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
              {mpesaMessage}
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-5">
                <Label>Payment method</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border border-border px-3 py-3 text-xs font-medium transition-colors',
                        provider === p.id && 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                      )}
                    >
                      <p.icon className="h-5 w-5" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {provider === 'MPESA' && (
                <div className="mt-4">
                  <Label htmlFor="phone">M-Pesa phone number</Label>
                  <Input
                    id="phone"
                    className="mt-1.5"
                    placeholder="07XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="coupon" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Coupon code (optional)
                </Label>
                <Input
                  id="coupon"
                  className="mt-1.5"
                  placeholder="e.g. KCSE2026"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>

              <Button
                className="mt-6 w-full"
                onClick={handlePay}
                isLoading={isSubmitting}
                disabled={provider === 'MPESA' && phone.trim().length < 9}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay now'}
              </Button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
