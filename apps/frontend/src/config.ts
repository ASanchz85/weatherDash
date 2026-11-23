export const LOCALE = 'es-ES';

export const WEATHER_ENDPOINT = '/api/weather';
/** El backend mantiene su propia caché; el frontend solo necesita consultarla periódicamente. */
export const WEATHER_POLL_INTERVAL_MS = 5 * 60 * 1000;
/** Reintento más rápido cuando la API local no responde. */
export const WEATHER_RETRY_INTERVAL_MS = 30 * 1000;
