'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Search, Shuffle } from 'lucide-react';
import { QuestionCard } from '@/components/questions/question-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Subject, Topic, Question } from '@/types';

interface SubjectWithTopics extends Subject {
  topics: Topic[];
}

export default function SubjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const [subject, setSubject] = React.useState<SubjectWithTopics | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [topicFilter, setTopicFilter] = React.useState('');
  const [difficultyFilter, setDifficultyFilter] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    api
      .get<{ subject: SubjectWithTopics }>(`/subjects/${params.slug}`)
      .then((d) => setSubject(d.subject))
      .catch(() => setNotFound(true));
  }, [params.slug]);

  const fetchQuestions = React.useCallback(
    async (random = false) => {
      setIsLoading(true);
      const query = new URLSearchParams({ subject: params.slug, limit: '12' });
      if (topicFilter) query.set('topic', topicFilter);
      if (difficultyFilter) query.set('difficulty', difficultyFilter);
      if (search) query.set('search', search);
      if (random) query.set('random', 'true');

      try {
        const data = await api.get<{ questions: Question[] }>(`/questions?${query.toString()}`);
        setQuestions(data.questions);
      } catch {
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [params.slug, topicFilter, difficultyFilter, search]
  );

  React.useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  if (notFound) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center text-center">
        <div>
          <h1 className="font-display text-xl font-semibold">Subject not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This subject may not be available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {subject && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{subject.name}</h1>
          <p className="mt-1 max-w-xl text-muted-foreground">{subject.description}</p>
        </motion.div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-9"
          />
        </div>

        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All topics</option>
          {subject?.topics.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Any difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <Button variant="outline" onClick={() => fetchQuestions(true)}>
          <Shuffle className="h-4 w-4" /> Random set
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : questions.length === 0 ? (
        <p className="mt-14 text-center text-muted-foreground">
          No approved questions match these filters yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
