import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { VerifyEmailStatus } from '@/components/auth/verify-email-status';

export const metadata: Metadata = { title: 'Verify email' };

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Email verification" subtitle="Confirming your email address.">
      <Suspense fallback={null}>
        <VerifyEmailStatus />
      </Suspense>
    </AuthShell>
  );
}
