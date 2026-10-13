import { io, type Socket } from 'socket.io-client';
import { clearSession, getAccess, saveTokens } from './session';
import type { Order } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function messageFrom(payload: { message?: unknown }, status: number) {
  if (typeof payload.message === 'string') return payload.message;
  if (status === 422) return 'Essa mudança de status não é permitida';
  return 'Não foi possível concluir a ação';
}

async function refreshSession() {
  const refreshToken = sessionStorage.getItem('oficina.refresh');
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return false;
  }
  const body = (await response.json()) as { accessToken: string; refreshToken: string };
  saveTokens(body.accessToken, body.refreshToken);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const access = getAccess();
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && !path.startsWith('/api/v1/auth/login')) {
    const renewed = await refreshSession();
    if (renewed) return api<T>(path, init, false);
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: unknown };
    throw new Error(messageFrom(payload, response.status));
  }
  if (response.status === 204) return undefined as T;
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return (await response.json()) as T;
  return response as unknown as T;
}

export async function photoUrl(orderId: string, photoId: string) {
  const headers = new Headers();
  const access = getAccess();
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/photos/${photoId}`, { headers });
  if (!response.ok) throw new Error('Foto indisponível');
  return URL.createObjectURL(await response.blob());
}

export function connectBoard(onOrder: (order: Order) => void): Socket {
  const socket = io(`${API_URL}/oficina`, { auth: { token: getAccess() } });
  socket.on('order.updated', onOrder);
  return socket;
}
