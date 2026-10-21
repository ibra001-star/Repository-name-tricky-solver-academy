import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Cookie policy' };

export default function CookiesPage() {
  return (
    <StaticPage title="Cookie policy" intro={`Last updated: ${SITE.updated}`}>
      <p>{SITE.name} uses only the cookies and browser storage it needs to work.</p>
      <h2>What we use</h2>
      <ul>
        <li>
          <strong>Sign-in cookie:</strong> a secure, httpOnly cookie that keeps you logged in and lets us renew your
          session safely.
        </li>
        <li>
          <strong>Preferences:</strong> your light or dark theme, and cached pages so the site can work offline.
        </li>
      </ul>
      <p>We do not use advertising cookies.</p>
      <h2>Your choices</h2>
      <p>
        You can clear cookies and site data in your browser settings at any time. If you block the sign-in cookie you
        will not be able to stay logged in.
      </p>
    </StaticPage>
  );
}
