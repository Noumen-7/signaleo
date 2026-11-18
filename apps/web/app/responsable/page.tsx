'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { StaffNav } from '@/components/StaffNav';
import { api } from '@/lib/api';
import { useStaff } from '@/lib/useStaff';
import { GRAVITY_LABELS, ORIGIN_LABELS, STATUS_LABELS, TYPE_LABELS, fmtDate, fmtDateTime } from '@/lib/labels';

type Row = {
  id: string;
  type: string;
  authorOrigin: string;
  gravity: string;
  status: string;
  incidentDate: string;
  createdAt: string;
  messageCount: number;
};

const EMPTY = { type: '', gravity: '', status: '', from: '', to: '', sort: 'gravity', order: 'desc' };

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, handleAuthError } = useStaff();
  const [filters, setFilters] = useState(EMPTY);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]);
    try {
      setRows(await api<Row[]>(`/staff/reports?${qs}`, { auth: true }));
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') {
      router.replace('/responsable/comptes');
      return;
    }
    load();
  }, [user, load, router]);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (!user) return null;
  if (user.role === 'ADMIN') return null;
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});

  return (
    <>
      <StaffNav user={user} onLogout={logout} />
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ marginBottom: 0 }}>Signalements</h1>
      </div>

      <div className="row" style={{ marginBottom: '1rem' }}>
        {Object.entries(STATUS_LABELS).map(([k, l]) => (
          <span key={k} className={`badge st-${k}`}>{l} : {counts[k] ?? 0}</span>
        ))}
      </div>

      <div className="card">
        <div className="filters">
          <div className="field">
            <label htmlFor="f-type">Type</label>
            <select id="f-type" value={filters.type} onChange={set('type')}>
              <option value="">Tous</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-gravity">Gravité</label>
            <select id="f-gravity" value={filters.gravity} onChange={set('gravity')}>
              <option value="">Toutes</option>
              {Object.entries(GRAVITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-status">Statut</label>
            <select id="f-status" value={filters.status} onChange={set('status')}>
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-from">Reçu du</label>
            <input id="f-from" type="date" value={filters.from} onChange={set('from')} />
          </div>
          <div className="field">
            <label htmlFor="f-to">au</label>
            <input id="f-to" type="date" value={filters.to} onChange={set('to')} />
          </div>
          <div className="field">
            <label htmlFor="f-sort">Trier par</label>
            <select id="f-sort" value={filters.sort} onChange={set('sort')}>
              <option value="gravity">Gravité (urgents d&apos;abord)</option>
              <option value="createdAt">Date de réception</option>
              <option value="incidentDate">Date des faits</option>
              <option value="status">Statut</option>
              <option value="type">Type</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-order">Ordre</label>
            <select id="f-order" value={filters.order} onChange={set('order')}>
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setFilters(EMPTY)}>Réinitialiser</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Gravité</th>
                <th>Type</th>
                <th>Origine</th>
                <th>Statut</th>
                <th>Date des faits</th>
                <th>Reçu le</th>
                <th>Msg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`row-link ${r.gravity === 'URGENTE' ? 'urgent' : ''}`}
                  onClick={() => router.push(`/responsable/${r.id}`)}
                >
                  <td><span className={`badge gr-${r.gravity}`}>{GRAVITY_LABELS[r.gravity]}</span></td>
                  <td>{TYPE_LABELS[r.type]}</td>
                  <td>{ORIGIN_LABELS[r.authorOrigin] ?? r.authorOrigin}</td>
                  <td><span className={`badge st-${r.status}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td>{fmtDate(r.incidentDate)}</td>
                  <td>{fmtDateTime(r.createdAt)}</td>
                  <td>{r.messageCount}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="muted">Aucun signalement ne correspond aux filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {loading && <p className="muted small">Chargement…</p>}
      </div>
    </>
  );
}
