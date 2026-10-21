import type { Metadata } from 'next';
import { Mail, MapPin } from 'lucide-react';
import { StaticPage } from '@/components/pages/static-page';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Contact the Tricky Solver Academy team.',
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact us" intro="Questions about your account, payments or the content? We read every message.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <Mail className="h-5 w-5 text-brand-500" />
          <h2 className="!mt-3 !text-base">Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <MapPin className="h-5 w-5 text-brand-500" />
          <h2 className="!mt-3 !text-base">Based in</h2>
          <p className="mt-1 text-sm text-muted-foreground">{SITE.location}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        For payment problems, please include the email you registered with and the M-Pesa or card reference so we can
        find your payment quickly.
      </p>
    </StaticPage>
  );
}
