import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export const AuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-brand-50/50 to-background px-4 py-12 dark:from-brand-950/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            Tricky Solver <span className="text-gold-500">Academy</span>
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </div>
  );
};
