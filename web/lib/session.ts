import type { SessionUser } from './types';

const ACCESS = 'oficina.access';
const REFRESH = 'oficina.refresh';
const USER = 'oficina.user';

export function getAccess() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS);
}

export function getUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function saveSession(accessToken: string, refreshToken: string, user: SessionUser) {
  sessionStorage.setItem(ACCESS, accessToken);
  sessionStorage.setItem(REFRESH, refreshToken);
  sessionStorage.setItem(USER, JSON.stringify(user));
}

export function saveTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem(ACCESS, accessToken);
  sessionStorage.setItem(REFRESH, refreshToken);
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
  sessionStorage.removeItem(USER);
}
