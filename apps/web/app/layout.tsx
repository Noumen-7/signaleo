import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: "Signal'eo — Signaler le harcèlement en toute confidentialité",
  description: 'Plateforme anonyme de signalement du harcèlement scolaire.',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1f7a4d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link href="/" className="brand">
              <span className="brand-dot" aria-hidden>●</span> Signal&apos;eo
            </Link>
            <nav className="nav">
              <Link href="/deposer">Signaler</Link>
              <Link href="/suivi">Suivre</Link>
              <Link href="/responsable" className="nav-muted">Espace responsable</Link>
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container">
            <p>
              En cas de danger immédiat, adresse-toi directement à un adulte de confiance ou
              contacte les services d&apos;urgence.
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
