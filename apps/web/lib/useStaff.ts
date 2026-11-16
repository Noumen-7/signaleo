'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, session, StaffUser } from './api';

/** Redirige vers la connexion si aucune session n'est présente. */
export function useStaff() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    const u = session.user;
    if (!session.token || !u) router.replace('/responsable/login');
    else setUser(u);
  }, [router]);

  const logout = () => {
    session.clear();
    router.replace('/responsable/login');
  };

  const handleAuthError = (err: unknown) => {
    // Ne déconnecter que sur 401 (jeton expiré / invalide), pas si l’API redémarre (status 0)
    if (err instanceof ApiError && err.status === 401) logout();
  };

  return { user, logout, handleAuthError };
}
