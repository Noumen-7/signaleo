'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { api, session, StaffUser } from '@/lib/api';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const tabsId = useId();
  const [mode, setMode] = useState<Mode>('login');
  const [dir, setDir] = useState<'left' | 'right'>('right');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setDir(next === 'register' ? 'left' : 'right');
    setMode(next);
    setAnimKey((k) => k + 1);
    setError(null);
    setNotice(null);
  }

  useEffect(() => {
    const el = panelRef.current?.querySelector<HTMLElement>(
      mode === 'register' ? '#name' : '#email',
    );
    el?.focus({ preventScroll: true });
  }, [mode]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const r = await api<{ message: string }>('/auth/register', {
          method: 'POST',
          body: { email, password, displayName },
        });
        setNotice(r.message);
        setDir('right');
        setMode('login');
        setAnimKey((k) => k + 1);
        setPassword('');
        return;
      }
      const r = await api<{ accessToken: string; user: StaffUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      session.save(r.accessToken, r.user);
      router.push(r.user.role === 'ADMIN' ? '/responsable/comptes' : '/responsable');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <p className="auth-eyebrow">Personnel de l&apos;établissement</p>
        <h1>Espace responsable</h1>
        <p className="muted auth-lead" aria-live="polite">
          {mode === 'login'
            ? 'Compte déjà validé ? Connecte-toi pour traiter les signalements.'
            : 'Nouveau ici ? Crée ton compte — l’admin valide, puis tu pourras te connecter.'}
        </p>
      </div>

      <div className="auth-card card">
        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Connexion ou inscription"
        >
          <span
            className={`auth-tabs-pill ${mode === 'register' ? 'is-register' : 'is-login'}`}
            aria-hidden
          />
          <button
            type="button"
            role="tab"
            id={`${tabsId}-login`}
            aria-selected={mode === 'login'}
            aria-controls={`${tabsId}-panel`}
            className={mode === 'login' ? 'is-active' : undefined}
            onClick={() => switchMode('login')}
          >
            Connexion
          </button>
          <button
            type="button"
            role="tab"
            id={`${tabsId}-register`}
            aria-selected={mode === 'register'}
            aria-controls={`${tabsId}-panel`}
            className={mode === 'register' ? 'is-active' : undefined}
            onClick={() => switchMode('register')}
          >
            Créer un compte
          </button>
        </div>

        <div
          ref={panelRef}
          id={`${tabsId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${mode}`}
          className="auth-panel-frame"
        >
          <form
            key={animKey}
            className={`auth-panel auth-slide-${dir}`}
            onSubmit={submit}
          >
            {error && <div className="alert alert-error">{error}</div>}
            {notice && <div className="alert alert-info">{notice}</div>}

            {mode === 'register' && (
              <div className="field">
                <label htmlFor="name">Nom affiché</label>
                <input
                  id="name"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">E-mail professionnel</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">
                {mode === 'register' ? 'Mot de passe (≥ 12 caractères)' : 'Mot de passe'}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={12}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn auth-submit" disabled={loading}>
              {loading
                ? mode === 'register'
                  ? 'Création…'
                  : 'Connexion…'
                : mode === 'register'
                  ? 'Créer mon compte'
                  : 'Se connecter'}
            </button>

            <p className="auth-switch muted small">
              {mode === 'login' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode('register')}>
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà inscrit ?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode('login')}>
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
