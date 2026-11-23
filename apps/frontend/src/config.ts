export const LOCALE = 'es-ES';

export const WEATHER_ENDPOINT = '/api/weather';
export const UI_CONFIG_ENDPOINT = '/api/config';
/** Intervalo de rotación por defecto si la API local no puede facilitar la configuración. */
export const DEFAULT_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
/** Duración de cada mitad (salida y entrada) del fundido entre vistas. */
export const ROTATION_FADE_MS = 350;
/** El backend mantiene su propia caché; el frontend solo necesita consultarla periódicamente. */
export const WEATHER_POLL_INTERVAL_MS = 5 * 60 * 1000;
/** Reintento más rápido cuando la API local no responde. */
export const WEATHER_RETRY_INTERVAL_MS = 30 * 1000;
