import type { z } from 'zod';

export class OpenMeteoError extends Error {
  override readonly name = 'OpenMeteoError';
}

export interface OpenMeteoClientOptions {
  requestTimeoutMs: number;
  fetchFn?: typeof fetch;
}

export interface OpenMeteoClient {
  /** Pide la URL con timeout, comprueba el estado HTTP y valida la respuesta con el esquema. */
  fetchValidated<Schema extends z.ZodType>(url: URL, schema: Schema): Promise<z.infer<Schema>>;
}

/** Acceso HTTP común a todas las APIs de Open-Meteo; cualquier fallo se convierte en OpenMeteoError. */
export function createOpenMeteoClient({ requestTimeoutMs, fetchFn = fetch }: OpenMeteoClientOptions): OpenMeteoClient {
  return {
    async fetchValidated(url, schema) {
      let response: Response;
      try {
        response = await fetchFn(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
      } catch (error) {
        const reason =
          error instanceof Error && error.name === 'TimeoutError'
            ? `timeout tras ${requestTimeoutMs} ms`
            : 'error de red';
        throw new OpenMeteoError(`Open-Meteo no responde (${reason})`, { cause: error });
      }

      if (!response.ok) {
        throw new OpenMeteoError(`Open-Meteo respondió con estado HTTP ${response.status}`);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (error) {
        throw new OpenMeteoError('Open-Meteo devolvió una respuesta que no es JSON', { cause: error });
      }

      const result = schema.safeParse(body);
      if (!result.success) {
        throw new OpenMeteoError('Open-Meteo devolvió datos con un formato inesperado', {
          cause: result.error,
        });
      }
      return result.data;
    },
  };
}
