'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { StaffNav } from '@/components/StaffNav';
import { api } from '@/lib/api';
import { useStaff } from '@/lib/useStaff';
import { fmtDateTime } from '@/lib/labels';

type Account = {
  id: string;
  email: string;
  displayName: string;
  role: 'RESPONSABLE' | 'ADMIN';
  active: boolean;
  approvedAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
};

type PendingAction =
  | { type: 'approve'; account: Account }
  | { type: 'deactivate'; account: Account }
  | { type: 'reactivate'; account: Account };

function accountState(a: Account) {
  if (!a.approvedAt) return { label: 'En attente', className: 'st-NOUVEAU' };
  if (!a.active) return { label: 'Désactivé', className: 'st-CLOS' };
  return { label: 'Actif', className: 'st-TRAITE' };
}

export default function ComptesPage() {
  const router = useRouter();
  const { user, handleAuthError, logout } = useStaff();
  const [rows, setRows] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api<Account[]>('/staff/accounts', { auth: true }));
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.replace('/responsable');
      return;
    }
    load();
  }, [user, load, router]);

  if (!user || user.role !== 'ADMIN') return null;

  async function runPending() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const { account, type } = pending;
      if (type === 'approve') {
        await api(`/staff/accounts/${account.id}`, {
          method: 'PATCH',
          auth: true,
          body: { approve: true },
        });
      } else {
        await api(`/staff/accounts/${account.id}`, {
          method: 'PATCH',
          auth: true,
          body: { active: type === 'reactivate' },
        });
      }
      setPending(null);
      await load();
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const modalCopy = pending
    ? pending.type === 'approve'
      ? {
          title: 'Valider ce compte ?',
          message: `${pending.account.displayName} (${pending.account.email}) pourra se connecter après validation.`,
          confirmLabel: 'Valider',
          danger: false,
        }
      : pending.type === 'deactivate'
        ? {
            title: 'Désactiver ce compte ?',
            message: `${pending.account.displayName} (${pending.account.email}) ne pourra plus se connecter.`,
            confirmLabel: 'Désactiver',
            danger: true,
          }
        : {
            title: 'Réactiver ce compte ?',
            message: `${pending.account.displayName} (${pending.account.email}) pourra à nouveau se connecter.`,
            confirmLabel: 'Réactiver',
            danger: false,
          }
    : null;

  return (
    <>
      <StaffNav user={user} onLogout={logout} />
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ marginBottom: 0 }}>Valider les comptes</h1>
        <p className="muted" style={{ margin: '.35rem 0 0' }}>
          Tu valides ou désactives les accès. Tu ne vois jamais les mots de passe, ni les signalements.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Comptes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>E-mail</th>
                <th>Rôle</th>
                <th>État</th>
                <th>Créé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Aucun compte pour le moment.
                  </td>
                </tr>
              )}
              {rows.map((a) => {
                const st = accountState(a);
                return (
                  <tr key={a.id}>
                    <td>{a.displayName}</td>
                    <td>{a.email}</td>
                    <td>{a.role}</td>
                    <td>
                      <span className={`badge ${st.className}`}>{st.label}</span>
                    </td>
                    <td>{fmtDateTime(a.createdAt)}</td>
                    <td>
                      <div className="row">
                        {!a.approvedAt ? (
                          <button
                            className="btn btn-sm"
                            type="button"
                            onClick={() => setPending({ type: 'approve', account: a })}
                          >
                            Valider
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline btn-sm"
                            type="button"
                            onClick={() =>
                              setPending({
                                type: a.active ? 'deactivate' : 'reactivate',
                                account: a,
                              })
                            }
                          >
                            {a.active ? 'Désactiver' : 'Réactiver'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!pending && !!modalCopy}
        title={modalCopy?.title ?? ''}
        message={modalCopy?.message ?? ''}
        confirmLabel={modalCopy?.confirmLabel}
        danger={modalCopy?.danger}
        busy={busy}
        onConfirm={runPending}
        onCancel={() => !busy && setPending(null)}
      />
    </>
  );
}
