interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  noStore?: boolean;
  fallbackError: string;
}

// The only place that talks to the app's HTTP API. Every endpoint answers with `{ success, data | error }`.
export async function apiRequest<T = void>(url: string, { method = 'GET', body, signal, noStore, fallbackError }: RequestOptions): Promise<T> {
  const response = await fetch(url, {
    method,
    signal,
    ...(noStore ? { cache: 'no-store' as const } : {}),
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const result: ApiEnvelope<T> = await response.json().catch(() => ({ success: false }));
  if (!response.ok || !result.success) throw new Error(result.error || fallbackError);
  return result.data as T;
}
