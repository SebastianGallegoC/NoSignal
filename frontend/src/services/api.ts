import { ACCESS_TOKEN_KEY } from '@/lib/authStorage';

import type { OfflineForm } from './db';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const loginApi = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `login_${response.status}`);
  }
  return response.json() as Promise<LoginResponse>;
};

export const postForm = async (payload: OfflineForm): Promise<Response> => {
  return fetch(`${API_BASE}/api/v1/forms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': payload.id_formulario,
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
};
