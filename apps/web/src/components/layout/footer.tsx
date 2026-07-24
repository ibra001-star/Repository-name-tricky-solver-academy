import Link from 'next/link';
import { GraduationCap, Facebook, Twitter, Youtube, Mail } from 'lucide-react';
import { NewsletterSignup } from '@/components/marketing/newsletter-signup';

const footerLinks = {
  Platform: [
    { href: '/subjects', label: 'Subjects' },
    { href: '/exams', label: 'Mock Exams' },
    { href: '/pricing', label: 'Premium Plans' },
    { href: '/blog', label: 'Blog' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/careers', label: 'Careers' },
    { href: '/affiliates', label: 'Affiliate Program' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
  ],
};

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              Tricky Solver <span className="text-gold-500">Academy</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Master Mathematics. Excel in Business Studies. Built for Kenyan CBC Senior School and KCSE students.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-brand-500">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-brand-500">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" aria-label="YouTube" className="text-muted-foreground hover:text-brand-500">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="mailto:hello@trickysolver.academy" aria-label="Email" className="text-muted-foreground hover:text-brand-500">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-5">
              <p className="text-sm font-medium">Get study tips in your inbox</p>
              <div className="mt-2">
                <NewsletterSignup />
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-display text-sm font-semibold text-foreground">{heading}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-brand-500">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Tricky Solver Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
