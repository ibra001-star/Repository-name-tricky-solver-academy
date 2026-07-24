'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerFormSchema, RegisterFormValues } from '@/lib/validators';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ApiError } from '@/lib/api';

export const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') ?? undefined;
  const registerUser = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { role: 'STUDENT' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await registerUser({ ...values, referralCode });
      router.push('/dashboard');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" className="mt-1.5" error={!!errors.firstName} {...register('firstName')} />
          {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" className="mt-1.5" error={!!errors.lastName} {...register('lastName')} />
          {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" className="mt-1.5" error={!!errors.email} {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
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

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          className="mt-1.5"
          error={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <Label htmlFor="role">I am a</Label>
        <select
          id="role"
          className="mt-1.5 flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('role')}
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-500 hover:underline">
          Log in
        </Link>
      </p>
    </motion.form>
  );
};
