import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticPage } from '@/components/pages/static-page';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About us',
  description: 'Tricky Solver Academy helps Kenyan secondary students master Mathematics and Business Studies.',
};

export default function AboutPage() {
  return (
    <StaticPage
      title="About Tricky Solver Academy"
      intro="A learning platform built by a classroom teacher, for Kenyan secondary school students."
    >
      <p>
        Tricky Solver Academy started in {SITE.location}, where many learners are still building their confidence in
        English and have limited access to textbooks and extra lessons. We built the platform to make Mathematics and
        Business Studies practice clear, affordable and available on any phone.
      </p>
      <h2>What you can do here</h2>
      <ul>
        <li>Practise topic-by-topic questions for CBC Senior School and KCSE.</li>
        <li>Sit timed mock exams and see worked answers straight away.</li>
        <li>Follow your progress, earn certificates and join live revision classes.</li>
        <li>Ask questions in the forum and read short guides on the blog.</li>
      </ul>
      <h2>Our approach</h2>
      <p>
        Plain language, step-by-step solutions, and questions written to match what teachers actually set. Mathematics
        and Business Studies come first, with more subjects planned.
      </p>
      <p>
        Have a question or suggestion? <Link href="/contact">Get in touch</Link>.
      </p>
    </StaticPage>
  );
}
