'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { StaffUser } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';

type Props = {
  user: StaffUser;
  onLogout: () => void;
};

export function StaffNav({ user, onLogout }: Props) {
  const pathname = usePathname();
  const isAdmin = user.role === 'ADMIN';
  const onComptes = pathname.startsWith('/responsable/comptes');
  const onSignalements =
    pathname === '/responsable' || /^\/responsable\/[^/]+$/.test(pathname);
  const [confirmLogout, setConfirmLogout] = useState(false);

  function requestLogout() {
    if (isAdmin) setConfirmLogout(true);
    else onLogout();
  }

  return (
    <>
      <div className="staff-nav">
        <div className="staff-nav-meta">
          <strong>{user.name}</strong>
          <span className="muted small">{isAdmin ? 'Admin technique' : 'Responsable'}</span>
        </div>
        <nav className="staff-nav-links" aria-label="Espace personnel">
          {!isAdmin && (
            <Link
              href="/responsable"
              className={onSignalements ? 'is-active' : undefined}
              prefetch={false}
            >
              Signalements
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/responsable/comptes"
              className={onComptes ? 'is-active' : undefined}
              prefetch={false}
            >
              Valider les comptes
            </Link>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={requestLogout}>
            Déconnexion
          </button>
        </nav>
      </div>

      {isAdmin && (
        <ConfirmModal
          open={confirmLogout}
          title="Se déconnecter ?"
          message="Tu quitteras l’espace d’administration technique."
          confirmLabel="Se déconnecter"
          onConfirm={() => {
            setConfirmLogout(false);
            onLogout();
          }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </>
  );
}
