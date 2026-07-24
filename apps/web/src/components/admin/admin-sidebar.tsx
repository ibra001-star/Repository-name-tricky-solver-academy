'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, DollarSign, FileCheck, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/uploads', label: 'Upload Approvals', icon: FileCheck },
  { href: '/admin/logs', label: 'Audit Logs', icon: ScrollText },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};
