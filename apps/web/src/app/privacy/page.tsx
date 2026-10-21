import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy policy" intro={`Last updated: ${SITE.updated}`}>
      <p>
        This policy explains what personal data {SITE.name} collects, why, and the choices you have. We process personal
        data in line with the Kenya Data Protection Act, 2019.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account details: name, email address, phone number (if you provide one) and password (stored only as a secure hash).</li>
        <li>Learning activity: exams attempted, answers, scores and progress.</li>
        <li>Payment details: the provider, amount and reference. Card numbers are handled by Stripe or PayPal and never stored by us. M-Pesa payments use your phone number.</li>
        <li>Technical data: basic device and log information used to keep the service secure.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run your account, show your progress and issue certificates.</li>
        <li>To process payments and prevent fraud.</li>
        <li>To send account emails and, if you opt in, reminders and newsletters.</li>
        <li>To improve questions and the platform.</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell your data. We share it only with service providers that help us operate (hosting, email, SMS,
        payments, file storage) and when required by law.
      </p>
      <h2>Your rights</h2>
      <p>
        You may ask to access, correct or delete your data, and to stop marketing messages, by contacting us at{' '}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
      <h2>Children</h2>
      <p>
        Many of our learners are under 18. If you are a parent or guardian and have a concern about your child&apos;s
        account, contact us and we will help.
      </p>
      <h2>Changes</h2>
      <p>We will update this page when our practices change.</p>
    </StaticPage>
  );
}
