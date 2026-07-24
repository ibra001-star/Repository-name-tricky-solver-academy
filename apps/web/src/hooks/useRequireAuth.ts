'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './useAuthStore';

// Redirects to /login if, after the initial silent-refresh attempt
// completes, there's still no authenticated user.
export const useRequireAuth = () => {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  React.useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [isInitialized, user, router]);

  return { user, isReady: isInitialized && !!user };
};
