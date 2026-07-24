import Link from 'next/link';
import { Calculator, Briefcase, FlaskConical, Dna, MonitorCog, Atom, ArrowRight } from 'lucide-react';
import { Subject } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mathematics: Calculator,
  'business-studies': Briefcase,
  chemistry: FlaskConical,
  biology: Dna,
  'computer-studies': MonitorCog,
  physics: Atom,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getSubjects(): Promise<Subject[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/subjects`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.subjects ?? [];
  } catch {
    return [];
  }
}

export const SubjectsShowcase = async () => {
  const subjects = await getSubjects();

  if (subjects.length === 0) return null;

  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Subjects we cover</h2>
          <p className="mt-4 text-muted-foreground">
            Starting with Mathematics and Business Studies — more subjects coming soon.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const Icon = iconMap[subject.slug] ?? Calculator;
            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-950">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{subject.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{subject.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-500 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
