import { Suspense } from 'react';

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="muted">Chargement…</p>}>{children}</Suspense>;
}
