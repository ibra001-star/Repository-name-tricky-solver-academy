'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useRequireAdmin();

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Admin</h1>
      <p className="mt-1 text-muted-foreground">Manage users, content, and revenue for Tricky Solver Academy.</p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
