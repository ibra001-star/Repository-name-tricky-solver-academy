import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FinalCta = () => {
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-brand-500 px-8 py-16 text-center text-white md:px-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to boost your grades?</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Join thousands of Kenyan students already practicing smarter with Tricky Solver Academy.
            </p>
            <Button asChild size="lg" variant="gold" className="mt-8">
              <Link href="/register">
                Create your free account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
