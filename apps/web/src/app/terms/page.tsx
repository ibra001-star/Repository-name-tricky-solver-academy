import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms of service' };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of service" intro={`Last updated: ${SITE.updated}`}>
      <p>By creating an account or using {SITE.name} you agree to these terms.</p>
      <h2>Your account</h2>
      <p>
        Keep your password private and give accurate details. You are responsible for activity on your account. Learners
        under 18 should use the platform with the knowledge of a parent or guardian.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Do not copy, resell or republish our questions and content without permission.</li>
        <li>Do not attempt to break, overload or gain unauthorised access to the platform.</li>
        <li>Be respectful in the forum and messages. We may remove content or accounts that abuse others.</li>
      </ul>
      <h2>Premium plans and payments</h2>
      <p>
        Premium access is sold as a monthly, yearly or lifetime plan, priced as shown on the pricing page. Payments are
        processed by M-Pesa, Stripe or PayPal. Access starts when a payment is confirmed. If a payment was taken but
        access did not start, contact us with the payment reference and we will sort it out.
      </p>
      <h2>Content</h2>
      <p>
        We work hard to keep questions and answers accurate, but we cannot guarantee exam results. Content is for
        practice and revision.
      </p>
      <h2>Changes and contact</h2>
      <p>
        We may update these terms. Continued use means you accept the changes. Questions:{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </StaticPage>
  );
}
