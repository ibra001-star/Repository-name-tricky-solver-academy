'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './useAuthStore';

// Redirects away from admin pages if the authenticated user isn't an
// ADMIN or SUPER_ADMIN, after the initial silent-refresh completes.
export const useRequireAdmin = () => {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  React.useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace('/login?redirect=/admin');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [isInitialized, user, router]);

  const isReady = isInitialized && !!user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  return { user, isReady };
};
