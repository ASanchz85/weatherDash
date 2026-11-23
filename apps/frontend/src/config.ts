export const LOCALE = 'es-ES';

export const WEATHER_ENDPOINT = '/api/weather';
export const AIR_QUALITY_ENDPOINT = '/api/air-quality';
export const UI_CONFIG_ENDPOINT = '/api/config';
/** Intervalo de rotación por defecto si la API local no puede facilitar la configuración. */
export const DEFAULT_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
/** Duración de cada mitad (salida y entrada) del fundido entre vistas. */
export const ROTATION_FADE_MS = 350;
/** Margen sobre el tiempo que indica el servidor para que su caché ya haya caducado al volver a consultar. */
export const REFRESH_GRACE_MS = 1000;
/** Reintento más rápido cuando la API local no responde. */
export const DATA_RETRY_INTERVAL_MS = 30 * 1000;
