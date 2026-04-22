export async function api<T=any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error || 'API error');
  return res.json();
}
