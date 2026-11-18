export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TOKEN_KEY = 'signaleo_token';
const USER_KEY = 'signaleo_user';

export type StaffUser = { email: string; role: 'RESPONSABLE' | 'ADMIN'; name: string };

/** Session personnel (localStorage) — conserve la connexion entre onglets / rechargements jusqu’à expiration du JWT ou déconnexion. */
export const session = {
  get token() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  },
  get user(): StaffUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StaffUser) : null;
  },
  save(token: string, user: StaffUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; formData?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!opts.formData) headers['Content-Type'] = 'application/json';
  if (opts.auth && session.token) headers.Authorization = `Bearer ${session.token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.formData
        ? opts.formData
        : opts.body
          ? JSON.stringify(opts.body)
          : undefined,
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Réessayez dans un instant.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(' · ') : data?.message;
    throw new ApiError(res.status, msg || 'Une erreur est survenue.');
  }
  return data as T;
}

/** Téléchargement authentifié (pièce jointe) */
export async function fetchBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers,
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Réessayez dans un instant.');
  }
  if (!res.ok) {
    let msg = 'Téléchargement impossible';
    try {
      const data = await res.json();
      const m = Array.isArray(data?.message) ? data.message.join(' · ') : data?.message;
      if (m) msg = m;
    } catch {
      /* réponse binaire / vide */
    }
    throw new ApiError(res.status, msg);
  }
  return res.blob();
}
