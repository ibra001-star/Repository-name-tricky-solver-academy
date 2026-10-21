'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { readSpreadsheetFile, SheetRow } from '@/lib/spreadsheet';
import { cn } from '@/lib/utils';

interface RowResult {
  row: number;
  status: 'ready' | 'error' | 'duplicate';
  errors: string[];
  summary?: { subject: string; topic: string; type: string; marks: number; text: string };
}
interface ImportReport {
  dryRun: boolean;
  total: number;
  ready: number;
  duplicates: number;
  errors: number;
  created: number;
  results: RowResult[];
}

const BATCH = 100;

export default function ImportQuestionsPage() {
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<SheetRow[]>([]);
  const [report, setReport] = React.useState<ImportReport | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setReport(null);
    setMessage(null);
    setRows([]);
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = await readSpreadsheetFile(file);
      if (parsed.length === 0) setMessage({ kind: 'error', text: 'No question rows were found in the "Questions" sheet.' });
      setRows(parsed);
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Could not read that file.' });
    }
  };

  // Sends rows in batches so a big workbook never exceeds the request limit.
  const run = async (dryRun: boolean) => {
    setBusy(true);
    setMessage(null);
    try {
      const merged: ImportReport = { dryRun, total: 0, ready: 0, duplicates: 0, errors: 0, created: 0, results: [] };
      for (let i = 0; i < rows.length; i += BATCH) {
        const part = await api.post<ImportReport>('/questions/import', { dryRun, rows: rows.slice(i, i + BATCH) });
        merged.total += part.total;
        merged.ready += part.ready;
        merged.duplicates += part.duplicates;
        merged.errors += part.errors;
        merged.created += part.created;
        merged.results.push(...part.results.map((r) => ({ ...r, row: r.row + i })));
      }
      setReport(merged);
      if (!dryRun) setMessage({ kind: 'success', text: `${merged.created} question(s) were added to the bank.` });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof ApiError || err instanceof Error ? err.message : 'Import failed.' });
    } finally {
      setBusy(false);
    }
  };

  const canImport = report && report.dryRun && report.ready > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Import questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an Excel (.xlsx) or CSV file. First we check every row without saving anything; then you confirm the import.
        </p>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600">
            <Upload className="h-4 w-4" /> Choose file
            <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={onFile} />
          </label>
          <a
            href="/templates/question-import-template.xlsx"
            download
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Download blank template
          </a>
          {fileName && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" /> {fileName} · {rows.length} row(s)
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => run(true)} disabled={busy} variant="outline">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} 1. Check file (nothing saved)
            </Button>
            <Button onClick={() => run(false)} disabled={busy || !canImport}>
              2. Import {report?.ready ?? 0} question(s)
            </Button>
          </div>
        )}
      </div>

      {message && (
        <div
          role="status"
          className={cn(
            'flex items-start gap-2 rounded-lg border p-4 text-sm',
            message.kind === 'error' ? 'border-destructive/40 text-destructive' : 'border-green-600/40 text-green-700 dark:text-green-400'
          )}
        >
          {message.kind === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
          {message.text}
        </div>
      )}

      {report && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="font-semibold text-green-700 dark:text-green-400">{report.ready} ready</span>
            <span className="font-semibold text-amber-600">{report.duplicates} already in bank</span>
            <span className="font-semibold text-destructive">{report.errors} with problems</span>
          </div>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {report.results.map((r) => (
              <li key={r.row} className="flex items-start gap-3 p-3 text-sm">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">Row {r.row}</span>
                <div className="min-w-0 flex-1">
                  {r.summary && (
                    <p className="truncate">
                      <span className="font-medium">{r.summary.topic}</span> · {r.summary.type.replace('_', ' ').toLowerCase()} · {r.summary.marks} marks —{' '}
                      <span className="text-muted-foreground">{r.summary.text}</span>
                    </p>
                  )}
                  {r.errors.map((er) => (
                    <p key={er} className={r.status === 'error' ? 'text-destructive' : 'text-amber-600'}>
                      {er}
                    </p>
                  ))}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    r.status === 'ready' && 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
                    r.status === 'duplicate' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                    r.status === 'error' && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  )}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
