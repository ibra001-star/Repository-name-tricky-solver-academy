'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unansweredCount: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const SubmitConfirmDialog = ({
  open,
  onOpenChange,
  unansweredCount,
  onConfirm,
  isSubmitting,
}: SubmitConfirmDialogProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-50 text-gold-600 dark:bg-gold-950/40">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <Dialog.Title className="mt-4 font-display text-lg font-semibold">Submit this exam?</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {unansweredCount > 0
              ? `You still have ${unansweredCount} unanswered question${unansweredCount !== 1 ? 's' : ''}. Once you submit, you cannot make further changes.`
              : 'You have answered all questions. Once you submit, you cannot make further changes.'}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Keep reviewing
            </Button>
            <Button onClick={onConfirm} isLoading={isSubmitting}>
              Submit exam
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
