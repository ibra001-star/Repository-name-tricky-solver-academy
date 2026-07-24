'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginFormSchema, LoginFormValues } from '@/lib/validators';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ApiError } from '@/lib/api';

export const LoginForm = () => {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [needsTwoFactor, setNeedsTwoFactor] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(values.email, values.password, values.twoFactorCode);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TWO_FACTOR_REQUIRED') {
        setNeedsTwoFactor(true);
      } else {
        setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {!needsTwoFactor ? (
        <>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" className="mt-1.5" error={!!errors.email} {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-brand-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            Two-factor authentication required
          </div>
          <Label htmlFor="twoFactorCode">Enter the 6-digit code from your authenticator app</Label>
          <Input
            id="twoFactorCode"
            className="mt-1.5 tracking-widest"
            maxLength={6}
            placeholder="000000"
            {...register('twoFactorCode')}
          />
          <p className="mt-2 text-xs text-muted-foreground">Signed in as {getValues('email')}</p>
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        {needsTwoFactor ? 'Verify & continue' : 'Log in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand-500 hover:underline">
          Sign up
        </Link>
      </p>
    </motion.form>
  );
};
