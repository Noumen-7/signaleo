'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { GRAVITY_LABELS, ORIGIN_LABELS, TYPE_LABELS } from '@/lib/labels';

const today = () => new Date().toISOString().slice(0, 10);
const MAX_FILE = 10 * 1024 * 1024;

export default function DeposerPage() {
  const [form, setForm] = useState({
    type: '',
    authorOrigin: 'VICTIME',
    date: today(),
    lieu: '',
    personnes: '',
    description: '',
    gravity: 'MOYENNE',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function onFile(e: { target: { files: FileList | null } }) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Image JPEG, PNG ou WebP uniquement.');
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE) {
      setError('Fichier trop volumineux (max. 10 Mo).');
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      const res = await api<{ trackingCode: string }>('/reports', { method: 'POST', formData: fd });
      setCode(res.trackingCode);
      setFile(null);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* sélection manuelle */
    }
  }

  if (code) {
    return (
      <div className="card narrow">
        <h1>Merci, ton signalement a bien été envoyé.</h1>
        <div className="alert alert-warn">
          <strong>Important : copie ce code maintenant.</strong> Il ne sera plus jamais affiché.
          C&apos;est le seul moyen de suivre ton dossier. Tu peux le donner à un parent de confiance.
        </div>
        <div className="code-box" aria-label="Code de suivi">{code}</div>
        <div className="actions">
          <button className="btn" type="button" onClick={copy}>
            {copied ? 'Code copié ✓' : 'Copier le code'}
          </button>
          <Link className="btn btn-outline" href={`/suivi?code=${encodeURIComponent(code)}`}>
            Aller au suivi
          </Link>
        </div>
        <p className="muted small" style={{ marginTop: '1rem' }}>
          Conseil : note-le sur papier. Aucune trace n&apos;est gardée sur cet appareil après fermeture de l&apos;onglet.
        </p>
      </div>
    );
  }

  return (
    <div className="narrow">
      <h1>Faire un signalement anonyme</h1>
      <p className="muted">
        Aucune information sur ton identité n&apos;est demandée. N&apos;écris pas ton nom dans les champs
        si tu veux rester anonyme.
      </p>

      <form className="card" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="type">Type de situation *</label>
          <select id="type" required value={form.type} onChange={set('type')}>
            <option value="" disabled>
              — Choisir —
            </option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="authorOrigin">Tu déposes en tant que *</label>
          <select id="authorOrigin" required value={form.authorOrigin} onChange={set('authorOrigin')}>
            {Object.entries(ORIGIN_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="date">Date des faits *</label>
            <input id="date" type="date" required max={today()} value={form.date} onChange={set('date')} />
          </div>
          <div className="field">
            <label htmlFor="gravity">À quel point est-ce grave ? *</label>
            <select id="gravity" value={form.gravity} onChange={set('gravity')}>
              {Object.entries(GRAVITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="lieu">
            Lieu *<span className="hint"> — ex. cour, cantine, réseaux sociaux…</span>
          </label>
          <input id="lieu" required minLength={2} maxLength={300} value={form.lieu} onChange={set('lieu')} />
        </div>

        <div className="field">
          <label htmlFor="personnes">
            Personnes impliquées *
            <span className="hint"> — victime(s), auteur(s), témoins (classe, prénom…)</span>
          </label>
          <textarea
            id="personnes"
            required
            minLength={2}
            maxLength={1000}
            style={{ minHeight: 80 }}
            value={form.personnes}
            onChange={set('personnes')}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Que s&apos;est-il passé ? *</label>
          <textarea
            id="description"
            required
            minLength={10}
            maxLength={5000}
            value={form.description}
            onChange={set('description')}
          />
          <span className="hint">{form.description.length}/5000</span>
        </div>

        <div className="field">
          <label htmlFor="file">
            Photo / capture (optionnel)
            <span className="hint"> — JPEG, PNG ou WebP, max. 10 Mo</span>
          </label>
          <input id="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
          {file && (
            <span className="hint">
              {file.name} ({Math.round(file.size / 1024)} Ko)
            </span>
          )}
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer anonymement'}
        </button>
      </form>
    </div>
  );
}
