export type SearchErrorKind = 'network' | 'auth' | 'ratelimit';

export class SearchError extends Error {
  kind: SearchErrorKind;

  constructor(kind: SearchErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/**
 * fetch with a hard timeout, JSON parsing, and errors normalized into the
 * three kinds the search UI knows how to render.
 */
export async function fetchJson<T>(
  url: string,
  opts: { signal?: AbortSignal; timeoutMs?: number } = {}
): Promise<T> {
  const { signal, timeoutMs = 10000 } = opts;

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  const onOuterAbort = () => timeoutController.abort();
  signal?.addEventListener('abort', onOuterAbort);

  try {
    const res = await fetch(url, { signal: timeoutController.signal });
    if (res.status === 401 || res.status === 403) {
      throw new SearchError('auth', `Auth failed (${res.status})`);
    }
    if (res.status === 429) {
      throw new SearchError('ratelimit', 'Rate limited');
    }
    if (!res.ok) {
      throw new SearchError('network', `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof SearchError) throw err;
    // Re-throw user-initiated aborts untouched so callers can ignore them.
    if (signal?.aborted) throw err;
    throw new SearchError('network', err instanceof Error ? err.message : 'Network error');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError' && !(err instanceof SearchError);
}
