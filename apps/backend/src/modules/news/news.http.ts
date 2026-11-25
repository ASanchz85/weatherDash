export class NewsProviderError extends Error {
  override readonly name = 'NewsProviderError';
}

export interface FeedRequestOptions {
  requestTimeoutMs: number;
  fetchFn?: typeof fetch;
}

/** Descarga el cuerpo de un feed; cualquier fallo de red, timeout o estado HTTP de error es un `NewsProviderError`. */
export async function fetchFeedText(
  url: string,
  { requestTimeoutMs, fetchFn = fetch }: FeedRequestOptions,
): Promise<string> {
  let response: Response;
  try {
    response = await fetchFn(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'TimeoutError' ? `timeout tras ${requestTimeoutMs} ms` : 'error de red';
    throw new NewsProviderError(`El feed de noticias no responde (${reason})`, { cause: error });
  }

  if (!response.ok) {
    throw new NewsProviderError(`El feed de noticias respondió con estado HTTP ${response.status}`);
  }

  return response.text();
}
