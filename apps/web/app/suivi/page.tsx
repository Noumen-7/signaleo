'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AUTHOR_LABELS, STATUS_HELP, STATUS_LABELS, TYPE_LABELS, fmtDateTime } from '@/lib/labels';

type Msg = { id: string; author: string; content: string; createdAt: string };
type Track =
  | { ok: false; message: string }
  | {
      ok: true;
      status: string;
      type: string;
      createdAt: string;
      updatedAt: string;
      hasAttachment?: boolean;
      messages: Msg[];
    };

export default function SuiviPage() {
  const params = useSearchParams();
  const [code, setCode] = useState('');
  const [data, setData] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [author, setAuthor] = useState<'ELEVE' | 'PARENT'>('ELEVE');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = params.get('code');
    if (q) {
      setCode(q);
      void (async () => {
        setLoading(true);
        try {
          setData(await api<Track>(`/reports/track/${encodeURIComponent(q.trim())}`));
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [params]);

  async function load(c = code) {
    setError(null);
    setLoading(true);
    try {
      setData(await api<Track>(`/reports/track/${encodeURIComponent(c.trim())}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await load();
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    setError(null);
    try {
      const r = await api<{ ok: boolean; message?: string }>(
        `/reports/track/${encodeURIComponent(code.trim())}/messages`,
        { method: 'POST', body: { content: msg, author } },
      );
      if (!r.ok) setError(r.message ?? "Le message n'a pas pu être envoyé.");
      else {
        setMsg('');
        await load();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="narrow">
      <h1>Suivre un signalement</h1>
      <p className="muted">
        Saisis le code secret reçu lors du signalement. Les parents peuvent utiliser le même code.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="code">Code de suivi</label>
          <input
            id="code"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ fontFamily: 'ui-monospace, Consolas, monospace', letterSpacing: '.05em' }}
          />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Recherche…' : 'Consulter'}</button>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

      {data && !data.ok && <div className="card alert-info">{data.message}</div>}

      {data && data.ok && (
        <>
          <div className="card">
            <div className="row space-between">
              <h2 style={{ margin: 0 }}>{TYPE_LABELS[data.type]}</h2>
              <span className={`badge st-${data.status}`}>{STATUS_LABELS[data.status]}</span>
            </div>
            <p>{STATUS_HELP[data.status]}</p>
            <p className="muted small">
              Envoyé le {fmtDateTime(data.createdAt)} · Dernière mise à jour le {fmtDateTime(data.updatedAt)}
              {data.hasAttachment ? ' · Une pièce jointe a été transmise à l’établissement' : ''}
            </p>
          </div>

          <div className="card">
            <h2>Messages</h2>
            {data.messages.length === 0 && (
              <p className="muted">Aucun message pour le moment.</p>
            )}
            <div className="messages">
              {data.messages.map((m) => {
                const mine = m.author === author;
                return (
                  <div key={m.id} className={`msg ${mine ? 'msg-mine' : 'msg-theirs'}`}>
                    <div className="msg-meta">{AUTHOR_LABELS[m.author]} · {fmtDateTime(m.createdAt)}</div>
                    {m.content}
                  </div>
                );
              })}
            </div>

            {data.status !== 'CLOS' ? (
              <form onSubmit={send}>
                <div className="field">
                  <label htmlFor="author">J&apos;écris en tant que</label>
                  <select id="author" value={author} onChange={(e) => setAuthor(e.target.value as 'ELEVE' | 'PARENT')}>
                    <option value="ELEVE">Élève</option>
                    <option value="PARENT">Parent</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="msg">Nouveau message</label>
                  <textarea id="msg" maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} style={{ minHeight: 90 }} />
                </div>
                <div className="row">
                  <button className="btn" disabled={sending || !msg.trim()}>{sending ? 'Envoi…' : 'Envoyer'}</button>
                  <button type="button" className="btn btn-outline" onClick={() => load()}>Actualiser</button>
                </div>
              </form>
            ) : (
              <p className="muted small">Ce dossier est clos : la messagerie est fermée.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
