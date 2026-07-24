'use client';

import * as React from 'react';
import { Loader2, FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { TeacherUpload } from '@/types';

export default function AdminUploadsPage() {
  const [uploads, setUploads] = React.useState<TeacherUpload[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const fetchUploads = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ uploads: TeacherUpload[] }>('/uploads/pending');
      setUploads(data.uploads);
    } catch {
      setUploads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setBusyId(id);
    try {
      await api.patch(`/uploads/${id}/review`, { status });
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch {
      // no-op
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No uploads awaiting review right now.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <div>
              <p className="font-medium">{upload.title}</p>
              <p className="text-xs text-muted-foreground">
                {upload.subjectArea} · {upload.fileType.toUpperCase()} · by {upload.teacher?.firstName}{' '}
                {upload.teacher?.lastName}
                {upload.teacher?.school ? ` (${upload.teacher.school})` : ''}
              </p>
              <a
                href={upload.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-brand-500 hover:underline"
              >
                View file →
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              isLoading={busyId === upload.id}
              onClick={() => review(upload.id, 'REJECTED')}
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
            <Button size="sm" isLoading={busyId === upload.id} onClick={() => review(upload.id, 'APPROVED')}>
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
