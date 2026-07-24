import Link from 'next/link';
import { Clock, ClipboardList, Crown, Users } from 'lucide-react';
import { Exam } from '@/types';
import { Button } from '@/components/ui/button';

const examTypeLabels: Record<string, string> = {
  TOPICAL: 'Topical Revision',
  CAT: 'CAT',
  MIDTERM: 'Midterm',
  END_TERM: 'End Term',
  KCSE_MOCK: 'KCSE Mock',
  KCSE_PREDICTION: 'KCSE Prediction',
  CBC_ASSESSMENT: 'CBC Assessment',
  HOLIDAY_ASSIGNMENT: 'Holiday Assignment',
  PAST_PAPER: 'Past Paper',
};

export const ExamCard = ({ exam }: { exam: Exam }) => {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          {examTypeLabels[exam.examType] ?? exam.examType}
        </span>
        {exam.isPremium && (
          <span className="flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 dark:bg-gold-950/40 dark:text-gold-400">
            <Crown className="h-3 w-3" /> Premium
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold">{exam.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{exam.subject.name}</p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {exam.durationMinutes} min
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList className="h-3.5 w-3.5" /> {exam.totalMarks} marks
        </span>
        {exam._count && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {exam._count.attempts} attempts
          </span>
        )}
      </div>

      <Button asChild className="mt-5 w-full">
        <Link href={`/exams/${exam.id}/take`}>Start exam</Link>
      </Button>
    </div>
  );
};
