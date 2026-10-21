import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticPage } from '@/components/pages/static-page';

export const metadata: Metadata = { title: 'Referral & affiliate program' };

export default function AffiliatesPage() {
  return (
    <StaticPage
      title="Referral program"
      intro="Share Tricky Solver Academy with friends and classmates and earn rewards."
    >
      <p>
        Every account has a personal referral link. When someone signs up through your link and becomes a premium
        member, you both receive a reward. Log in and open the <Link href="/referrals">Referrals</Link> page to get
        your link and track your rewards.
      </p>
      <p>
        Teachers or school groups who would like to partner with us can reach out through the{' '}
        <Link href="/contact">contact page</Link>.
      </p>
    </StaticPage>
  );
}
