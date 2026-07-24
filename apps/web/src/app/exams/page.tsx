'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, ClipboardX } from 'lucide-react';
import { ExamCard } from '@/components/exam/exam-card';
import { api } from '@/lib/api';
import { Exam, Subject } from '@/types';

const examTypes = [
  { value: '', label: 'All types' },
  { value: 'TOPICAL', label: 'Topical Revision' },
  { value: 'CAT', label: 'CAT' },
  { value: 'MIDTERM', label: 'Midterm' },
  { value: 'END_TERM', label: 'End Term' },
  { value: 'KCSE_MOCK', label: 'KCSE Mock' },
  { value: 'KCSE_PREDICTION', label: 'KCSE Prediction' },
  { value: 'CBC_ASSESSMENT', label: 'CBC Assessment' },
  { value: 'HOLIDAY_ASSIGNMENT', label: 'Holiday Assignment' },
  { value: 'PAST_PAPER', label: 'Past Paper' },
];

export default function ExamsPage() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<{ subjects: Subject[] }>('/subjects')
      .then((d) => setSubjects(d.subjects))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (subjectFilter) params.set('subject', subjectFilter);
    if (typeFilter) params.set('examType', typeFilter);

    api
      .get<{ exams: Exam[] }>(`/exams?${params.toString()}`)
      .then((d) => setExams(d.exams))
      .catch(() => setExams([]))
      .finally(() => setIsLoading(false));
  }, [subjectFilter, typeFilter]);

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Attempt an exam</h1>
        <p className="mt-1 text-muted-foreground">
          Timed mock exams, CATs, and past papers — marked instantly where possible.
        </p>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {examTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : exams.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center text-muted-foreground">
          <ClipboardX className="h-10 w-10" />
          <p className="mt-3">No exams match these filters yet. Try a different subject or type.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}
