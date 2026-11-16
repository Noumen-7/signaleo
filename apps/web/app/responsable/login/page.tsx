'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, session, StaffUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ accessToken: string; user: StaffUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      session.save(r.accessToken, r.user);
      router.push('/responsable');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="narrow" style={{ maxWidth: 440 }}>
      <h1>Espace responsable</h1>
      <p className="muted">Accès réservé au personnel. E-mail et mot de passe (≥ 12 caractères).</p>
      <form className="card" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
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
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={12}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
