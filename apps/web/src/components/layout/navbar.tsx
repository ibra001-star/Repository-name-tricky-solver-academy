'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useAuthStore } from '@/hooks/useAuthStore';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/subjects', label: 'Subjects' },
  { href: '/exams', label: 'Exams' },
  { href: '/live-classes', label: 'Live Classes' },
  { href: '/forum', label: 'Forum' },
  { href: '/pricing', label: 'Premium' },
  { href: '/blog', label: 'Blog' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">
            Tricky Solver <span className="text-gold-500">Academy</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <Link
              href="/messages"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          )}
          <NotificationBell />
          <ThemeToggle />
          {user ? (
            <>
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              {user.role === 'TEACHER' && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/teacher/uploads">My Uploads</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link href="/register">Start Learning</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                <ThemeToggle />
                {user ? (
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => logout()}>
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild size="sm" variant="gold">
                      <Link href="/register">Start Learning</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
