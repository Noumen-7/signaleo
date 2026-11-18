'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { StaffNav } from '@/components/StaffNav';
import { api, fetchBlob } from '@/lib/api';
import { useStaff } from '@/lib/useStaff';
import {
  AUTHOR_LABELS,
  GRAVITY_LABELS,
  ORIGIN_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  fmtDate,
  fmtDateTime,
} from '@/lib/labels';

type Detail = {
  id: string;
  type: string;
  authorOrigin: string;
  gravity: string;
  status: string;
  incidentDate: string;
  createdAt: string;
  updatedAt: string;
  lieu: string;
  personnes: string;
  description: string;
  attachments: { id: string; mimeType: string; sizeBytes: number; name: string; createdAt: string }[];
  messages: { id: string; author: string; content: string; createdAt: string }[];
  internalNotes: { id: string; content: string; author: string; createdAt: string }[];
};

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, logout, handleAuthError } = useStaff();
  const [report, setReport] = useState<Detail | null>(null);
  const [status, setStatus] = useState('');
  const [gravity, setGravity] = useState('');
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<Detail>(`/staff/reports/${id}`, { auth: true });
      setReport(r);
      setStatus(r.status);
      setGravity(r.gravity);
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') {
      router.replace('/responsable/comptes');
      return;
    }
    load();
  }, [user, load, router]);

  if (!user || user.role === 'ADMIN') return null;

  async function saveStatus(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api(`/staff/reports/${id}/status`, { method: 'PATCH', auth: true, body: { status, gravity } });
      setNotice("Mise à jour enregistrée. L'auteur la verra lors de sa prochaine consultation.");
      await load();
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/staff/reports/${id}/messages`, { method: 'POST', auth: true, body: { content: reply } });
      setReply('');
      await load();
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openAttachment(attachmentId: string, name: string) {
    try {
      const blob = await fetchBlob(`/staff/reports/${id}/attachments/${attachmentId}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    }
  }

  async function sendNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/staff/reports/${id}/notes`, { method: 'POST', auth: true, body: { content: note } });
      setNote('');
      setNotice('Note interne enregistrée (invisible côté élève / parent).');
      await load();
    } catch (err) {
      handleAuthError(err);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StaffNav user={user} onLogout={logout} />
      <p><Link href="/responsable">← Retour à la liste</Link></p>
      {error && <div className="alert alert-error">{error}</div>}
      {!report && !error && <p className="muted">Chargement…</p>}

      {report && (
        <>
          <div className="card">
            <div className="row space-between">
              <h1 style={{ margin: 0 }}>{TYPE_LABELS[report.type]}</h1>
              <div className="row">
                <span className={`badge gr-${report.gravity}`}>{GRAVITY_LABELS[report.gravity]}</span>
                <span className={`badge st-${report.status}`}>{STATUS_LABELS[report.status]}</span>
              </div>
            </div>
            <dl className="dl" style={{ marginTop: '1rem' }}>
              <dt>Déposé par</dt><dd>{ORIGIN_LABELS[report.authorOrigin] ?? report.authorOrigin}</dd>
              <dt>Date des faits</dt><dd>{fmtDate(report.incidentDate)}</dd>
              <dt>Reçu le</dt><dd>{fmtDateTime(report.createdAt)}</dd>
              <dt>Lieu</dt><dd>{report.lieu}</dd>
              <dt>Personnes</dt><dd>{report.personnes}</dd>
              <dt>Description</dt><dd>{report.description}</dd>
            </dl>
            {(report.attachments?.length ?? 0) > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '.5rem' }}>Pièces jointes</h3>
                <ul className="attach-list">
                  {report.attachments.map((a) => (
                    <li key={a.id}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openAttachment(a.id, a.name)}>
                        {a.name} ({Math.round(a.sizeBytes / 1024)} Ko)
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form className="card" onSubmit={saveStatus}>
            <h2 style={{ marginTop: 0 }}>Traitement</h2>
            {notice && <div className="alert alert-info">{notice}</div>}
            <div className="grid-2">
              <div className="field">
                <label htmlFor="status">Statut</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="gravity">Gravité</label>
                <select id="gravity" value={gravity} onChange={(e) => setGravity(e.target.value)}>
                  {Object.entries(GRAVITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <button className="btn" disabled={busy || (status === report.status && gravity === report.gravity)}>
              Enregistrer
            </button>
          </form>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Échanges anonymes</h2>
            <p className="muted small">Visibles aussi par l&apos;auteur / le parent via le code de suivi.</p>
            {report.messages.length === 0 && <p className="muted">Aucun message.</p>}
            <div className="messages">
              {report.messages.map((m) => {
                const mine = m.author === 'STAFF';
                return (
                  <div key={m.id} className={`msg ${mine ? 'msg-mine' : 'msg-theirs'}`}>
                    <div className="msg-meta">{AUTHOR_LABELS[m.author]} · {fmtDateTime(m.createdAt)}</div>
                    {m.content}
                  </div>
                );
              })}
            </div>
            {report.status !== 'CLOS' && (
              <form onSubmit={sendReply}>
                <div className="field">
                  <label htmlFor="reply">Répondre à l&apos;auteur</label>
                  <textarea id="reply" maxLength={2000} style={{ minHeight: 90 }} value={reply} onChange={(e) => setReply(e.target.value)} />
                </div>
                <button className="btn" disabled={busy || !reply.trim()}>Envoyer</button>
              </form>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Notes internes</h2>
            <p className="muted small">Réservées au personnel — invisibles pour l&apos;élève et le parent.</p>
            {(report.internalNotes?.length ?? 0) === 0 && <p className="muted">Aucune note.</p>}
            <div className="messages">
              {(report.internalNotes ?? []).map((n) => (
                <div key={n.id} className="msg msg-mine">
                  <div className="msg-meta">{n.author} · {fmtDateTime(n.createdAt)}</div>
                  {n.content}
                </div>
              ))}
            </div>
            <form onSubmit={sendNote}>
              <div className="field">
                <label htmlFor="note">Ajouter une note interne</label>
                <textarea id="note" maxLength={4000} style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button className="btn btn-outline" disabled={busy || !note.trim()}>Enregistrer la note</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
