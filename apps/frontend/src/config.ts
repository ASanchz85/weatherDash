export const LOCALE = 'es-ES';

export const WEATHER_ENDPOINT = '/api/weather';
export const AIR_QUALITY_ENDPOINT = '/api/air-quality';
export const UI_CONFIG_ENDPOINT = '/api/config';
export const newsRotationEndpoint = (feed: string) => `/api/news/${feed}/rotation`;
/** Intervalo de rotación por defecto si la API local no puede facilitar la configuración. */
export const DEFAULT_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
/** Tiempo por noticia por defecto si la API local no puede facilitar la configuración. */
export const DEFAULT_NEWS_ITEM_DURATION_MS = 60 * 1000;
/** Veces que se muestra el ciclo completo de vistas del tiempo antes de pasar a un feed de noticias. */
export const WEATHER_REPETITIONS_PER_BLOCK = 2;
/** Duración total de la diapositiva con el título de lo que se va a mostrar, incluidos los fundidos. */
export const SLIDE_DURATION_MS = 2500;
/** Tope de la diapositiva de vídeo (dura 10 s) por si no llega a terminar, p. ej. si no puede reproducirse. */
export const VIDEO_FALLBACK_MS = 15 * 1000;
/** Duración de cada mitad (salida y entrada) del fundido entre vistas. */
export const ROTATION_FADE_MS = 350;
/** Margen sobre el tiempo que indica el servidor para que su caché ya haya caducado al volver a consultar. */
export const REFRESH_GRACE_MS = 1000;
/** Reintento más rápido cuando la API local no responde. */
export const DATA_RETRY_INTERVAL_MS = 30 * 1000;
