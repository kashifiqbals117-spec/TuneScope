import { getUserFriendlyError } from './errors.js';

// Support production VITE_API_URL if configured, otherwise fallback to local relative /api
const envApiUrl = (import.meta as any).env?.VITE_API_URL;
export const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/+$/, '')}/api` : '/api';

export class ApiError extends Error {
  public friendlyTitle: string;
  public friendlyMessage: string;
  public canRetry: boolean;

  constructor(public status: number, rawMessage: string, friendlyTitle?: string, friendlyMessage?: string) {
    const errorDetails = getUserFriendlyError({ status, message: rawMessage });
    super(friendlyMessage || errorDetails.message);
    this.name = 'ApiError';
    this.friendlyTitle = friendlyTitle || errorDetails.title;
    this.friendlyMessage = friendlyMessage || errorDetails.message;
    this.canRetry = errorDetails.canRetry;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('tunescope_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    const friendly = getUserFriendlyError(networkErr);
    throw new ApiError(0, networkErr.message || 'Network request failed', friendly.title, friendly.message);
  }

  if (!response.ok) {
    let rawErrorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      rawErrorMessage = errorData.error || errorData.message || rawErrorMessage;
    } catch {
      // JSON parse failed
    }

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Expired token
      localStorage.removeItem('tunescope_token');
      localStorage.removeItem('tunescope_user');
      window.dispatchEvent(new Event('tunescope:auth_expired'));
    }

    const friendly = getUserFriendlyError({ status: response.status, message: rawErrorMessage });
    throw new ApiError(response.status, rawErrorMessage, friendly.title, friendly.message);
  }

  return response.json();
}
