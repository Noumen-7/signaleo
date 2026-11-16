'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStaff } from '@/lib/useStaff';
import { fmtDateTime } from '@/lib/labels';

type Account = {
  id: string;
  email: string;
  displayName: string;
  role: 'RESPONSABLE' | 'ADMIN';
  active: boolean;
  createdAt: string;
  lockedUntil: string | null;
};

export default function ComptesPage() {
  const { user, handleAuthError, logout } = useStaff();
  const [rows, setRows] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'RESPONSABLE' as 'RESPONSABLE' | 'ADMIN',
  });

  const load = useCallback(async () => {
    try {
      setRows(await api<Account[]>('/staff/accounts', { auth: true }));
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (user?.role === 'ADMIN') load();
  }, [user, load]);

  if (!user) return null;
  if (user.role !== 'ADMIN') {
    return (
      <div className="alert alert-error">
        Accès réservé à l&apos;administrateur. <Link href="/responsable">Retour</Link>
      </div>
    );
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const r = await api<Account>('/staff/accounts', { method: 'POST', auth: true, body: form });
      setNotice(`Compte ${r.email} créé. Le collègue se connecte avec e-mail + mot de passe.`);
      setForm({ email: '', password: '', displayName: '', role: 'RESPONSABLE' });
      await load();
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    }
  }

  async function toggleActive(a: Account) {
    setError(null);
    try {
      await api(`/staff/accounts/${a.id}`, {
        method: 'PATCH',
        auth: true,
        body: { active: !a.active },
      });
      await load();
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    }
  }

  return (
    <>
      <p>
        <Link href="/responsable">← Signalements</Link>
      </p>
      <div className="row space-between" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Comptes du personnel</h1>
          <span className="muted small">Création et désactivation des accès</span>
        </div>
        <button className="btn btn-outline btn-sm" type="button" onClick={logout}>
          Déconnexion
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-info">{notice}</div>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Créer un compte</h2>
        <form onSubmit={create}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="name">Nom affiché</label>
              <input
                id="name"
                required
                minLength={2}
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="password">Mot de passe (≥ 12)</label>
              <input
                id="password"
                type="password"
                required
                minLength={12}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="role">Rôle</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'RESPONSABLE' | 'ADMIN' }))}
              >
                <option value="RESPONSABLE">Responsable</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
          </div>
          <button className="btn" type="submit">
            Créer
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Comptes existants</h2>
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
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.displayName}</td>
                  <td>{a.email}</td>
                  <td>{a.role}</td>
                  <td>
                    <span className={`badge ${a.active ? 'st-TRAITE' : 'st-CLOS'}`}>
                      {a.active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td>{fmtDateTime(a.createdAt)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => toggleActive(a)}>
                      {a.active ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
