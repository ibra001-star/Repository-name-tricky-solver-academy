import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your Tricky Solver Academy account.',
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your revision.">
      <LoginForm />
    </AuthShell>
  );
}
