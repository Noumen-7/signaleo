import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Signal'eo — Signaler le harcèlement en toute confidentialité",
  description: 'Plateforme anonyme de signalement du harcèlement scolaire.',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1f7a4d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link href="/" className="brand" prefetch>
              <span className="brand-mark" aria-hidden>
                S
              </span>
              <span className="brand-text">
                Signal&apos;eo
                <span className="brand-v1" title="Version 1">
                  V1
                </span>
              </span>
            </Link>
            <nav className="nav" aria-label="Navigation principale">
              <Link href="/deposer" prefetch>
                Signaler
              </Link>
              <Link href="/suivi" prefetch>
                Suivre
              </Link>
              <Link href="/responsable" className="nav-muted" prefetch={false}>
                Responsable
              </Link>
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container footer-inner">
            <p>
              En cas de danger immédiat, parle à un adulte de confiance ou contacte les services
              d&apos;urgence.
            </p>
            <p className="muted small">
              Signal&apos;eo n&apos;enregistre ni ton nom, ni ton adresse IP, ni ton appareil.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
