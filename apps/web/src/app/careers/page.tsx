import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Careers' };

export default function CareersPage() {
  return (
    <StaticPage title="Careers" intro="We are a small team and we are not hiring full-time roles right now.">
      <p>
        We do welcome teachers who would like to write or review questions for Mathematics, Business Studies and other
        subjects. If that is you, email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with your
        subject, level and TSC number or school.
      </p>
    </StaticPage>
  );
}
