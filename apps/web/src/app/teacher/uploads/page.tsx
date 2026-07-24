'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Loader2, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getAccessToken } from '@/lib/api';
import { TeacherUpload } from '@/types';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const statusConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; className: string; label: string }
> = {
  PENDING_REVIEW: { icon: Clock, className: 'text-gold-600 dark:text-gold-400', label: 'Pending review' },
  APPROVED: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-400', label: 'Approved' },
  REJECTED: { icon: XCircle, className: 'text-destructive', label: 'Rejected' },
};

export default function TeacherUploadsPage() {
  const { user } = useAuthStore();
  const [title, setTitle] = React.useState('');
  const [subjectArea, setSubjectArea] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploads, setUploads] = React.useState<TeacherUpload[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(true);

  const fetchUploads = React.useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch(`${API_BASE_URL}/uploads/mine`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include',
      });
      const json = await res.json();
      setUploads(json.data?.uploads ?? []);
    } catch {
      setUploads([]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or Word document to upload');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('subjectArea', subjectArea);

      const res = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Upload failed');
      }

      setTitle('');
      setSubjectArea('');
      setFile(null);
      fetchUploads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container max-w-3xl py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Upload revision material</h1>
        <p className="mt-1 text-muted-foreground">
          Share revision papers and marking schemes with students. Every upload is reviewed by an admin before it
          goes live.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            className="mt-1.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Form 4 Trigonometry Revision Notes"
            required
          />
        </div>

        <div>
          <Label htmlFor="subjectArea">Subject area</Label>
          <Input
            id="subjectArea"
            className="mt-1.5"
            value={subjectArea}
            onChange={(e) => setSubjectArea(e.target.value)}
            placeholder="e.g. Mathematics"
            required
          />
        </div>

        <div>
          <Label htmlFor="file">File (PDF or Word, max 20MB)</Label>
          <label
            htmlFor="file"
            className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center hover:border-brand-400"
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{file ? file.name : 'Click to choose a file'}</span>
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Submit for review
        </Button>
      </form>

      <h2 className="mt-10 font-display text-lg font-semibold">Your uploads</h2>
      {isLoadingList ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : uploads.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t uploaded anything yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {uploads.map((upload) => {
            const status = statusConfig[upload.status];
            const StatusIcon = status.icon;
            return (
              <div key={upload.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                  <div>
                    <p className="font-medium">{upload.title}</p>
                    <p className="text-xs text-muted-foreground">{upload.subjectArea}</p>
                    {upload.reviewNotes && (
                      <p className="mt-1 text-xs text-muted-foreground">Note: {upload.reviewNotes}</p>
                    )}
                  </div>
                </div>
                <span className={cn('flex shrink-0 items-center gap-1 text-xs font-medium', status.className)}>
                  <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
