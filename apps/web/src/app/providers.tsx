'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { ServiceWorkerRegistration } from '@/components/layout/service-worker-registration';
import { useAuthStore } from '@/hooks/useAuthStore';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const initialize = useAuthStore((s) => s.initialize);

  React.useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider>
      <ServiceWorkerRegistration />
      {children}
    </ThemeProvider>
  );
};
