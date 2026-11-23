/** Tiempo mínimo entre reintentos al proveedor tras un fallo, para no saturarlo ni retrasar respuestas. */
export const RETRY_AFTER_FAILURE_MS = 60 * 1000;

export interface CachedResourceOptions<T> {
  load: () => Promise<T>;
  /** Validez del dato en memoria. */
  ttlMs: number;
  now?: () => number;
  onFailure?: (error: unknown) => void;
}

export interface CachedValue<T> {
  value: T;
  /** Instante (ms) en que se obtuvo el dato del proveedor. */
  fetchedAt: number;
  /** true si la última actualización falló y se devuelve el último dato válido. */
  stale: boolean;
  /** Milisegundos hasta que conviene volver a consultar; en un dato desactualizado, hasta el próximo reintento. */
  nextRefreshInMs: number;
}

export interface CachedResource<T> {
  get(): Promise<CachedValue<T>>;
}

interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
}

/**
 * Dato en memoria con caducidad: las peticiones simultáneas comparten una sola carga, y si el proveedor
 * falla se sirve el último dato válido marcado como desactualizado, sin reintentar durante un minuto.
 * Si nunca hubo datos, propaga el error original.
 */
export function createCachedResource<T>({
  load,
  ttlMs,
  now = Date.now,
  onFailure,
}: CachedResourceOptions<T>): CachedResource<T> {
  let cache: CacheEntry<T> | null = null;
  let pending: Promise<CacheEntry<T>> | null = null;
  let lastFailureAt: number | null = null;

  async function refresh(): Promise<CacheEntry<T>> {
    const value = await load();
    const entry = { value, fetchedAt: now() };
    cache = entry;
    lastFailureAt = null;
    return entry;
  }

  /** Comparte una única petición en curso entre todos los clientes que la soliciten a la vez. */
  function refreshOnce(): Promise<CacheEntry<T>> {
    pending ??= refresh().finally(() => {
      pending = null;
    });
    return pending;
  }

  function isFresh(entry: CacheEntry<T>): boolean {
    return now() - entry.fetchedAt < ttlMs;
  }

  function isCoolingDown(): boolean {
    return lastFailureAt !== null && now() - lastFailureAt < RETRY_AFTER_FAILURE_MS;
  }

  function asFresh(entry: CacheEntry<T>): CachedValue<T> {
    return { ...entry, stale: false, nextRefreshInMs: Math.max(0, entry.fetchedAt + ttlMs - now()) };
  }

  function asStale(entry: CacheEntry<T>): CachedValue<T> {
    const retryAt = (lastFailureAt ?? now()) + RETRY_AFTER_FAILURE_MS;
    return { ...entry, stale: true, nextRefreshInMs: Math.max(0, retryAt - now()) };
  }

  return {
    async get() {
      if (cache && isFresh(cache)) return asFresh(cache);
      if (cache && isCoolingDown()) return asStale(cache);

      try {
        return asFresh(await refreshOnce());
      } catch (error) {
        lastFailureAt = now();
        onFailure?.(error);
        if (cache) return asStale(cache);
        throw error;
      }
    },
  };
}
