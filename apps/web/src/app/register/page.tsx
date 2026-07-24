import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Sign up for Tricky Solver Academy and start practicing Mathematics and Business Studies today.',
};

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start practicing in less than a minute — it's free.">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
