import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        It looks like you&apos;ve lost your internet connection. Pages and exams you&apos;ve already opened may
        still be available — try going back, or reconnect and refresh.
      </p>
    </div>
  );
}
