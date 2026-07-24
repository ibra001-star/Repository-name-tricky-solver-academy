import { Hero } from '@/components/landing/hero';
import { Stats } from '@/components/landing/stats';
import { SubjectsShowcase } from '@/components/landing/subjects-showcase';
import { Features } from '@/components/landing/features';
import { Testimonials } from '@/components/landing/testimonials';
import { FAQ } from '@/components/landing/faq';
import { FinalCta } from '@/components/landing/final-cta';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Tricky Solver Academy',
  description:
    'Online learning and assessment platform for Kenyan CBC Senior School and KCSE students, specializing in Mathematics and Business Studies.',
  url: 'https://trickysolver.academy',
  areaServed: { '@type': 'Country', name: 'Kenya' },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Stats />
      <SubjectsShowcase />
      <Features />
      <Testimonials />
      <FAQ />
      <FinalCta />
    </>
  );
}
