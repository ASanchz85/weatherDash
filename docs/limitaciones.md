# Limitaciones y trabajo pendiente del MVP

## Funcionales

- **Sin selector visual de localidad**: la localidad solo se cambia mediante variables de entorno y requiere reiniciar el backend.
- **Geocoding por nombre**: se toma el primer resultado de Open-Meteo dentro de `WEATHER_COUNTRY_CODE`. Para nombres ambiguos conviene fijar `WEATHER_LATITUDE`/`WEATHER_LONGITUDE`.
- **Localidad resuelta en memoria**: si se cambia la configuración hay que reiniciar el servidor; no se persiste nada en disco.
- **Zona horaria del reloj**: el reloj usa la zona horaria del sistema donde corre el navegador, que puede diferir de la de la localidad meteorológica.
- **Probabilidad de precipitación**: se usa el valor `current` de Open-Meteo, que es la del intervalo de 15 minutos en curso; puede ser `null` en algunos modelos y se muestra como «—».
- **Reintento tras fallo**: tras un fallo del proveedor se espera 1 minuto antes de reintentar (constante `RETRY_AFTER_FAILURE_MS`); no es configurable por entorno.

## Técnicas

- **Contrato de la API duplicado**: los tipos de `/api/weather` se definen en el backend (`weather.types.ts`) y en el frontend (`types/weather.ts`). Se optó por no crear un paquete compartido para mantener la simplicidad; si el contrato crece conviene extraer un workspace `packages/shared`.
- **Validación en el frontend**: se valida la respuesta de la API local con un validador manual (`parseWeatherData`) para no añadir Zod al bundle.
- **`@testing-library/user-event` no instalado**: el MVP no tiene interacción de usuario que probar. Se añadirá cuando exista (p. ej. un selector de localidad).
- **Script `start` del backend**: usa `NODE_ENV=production node …`, sintaxis de shell POSIX. En Windows habría que usar `cross-env` o definir `NODE_ENV` en `.env`.
- **Sin logs en fichero ni rotación**: Fastify registra en stdout en JSON; en la Raspberry Pi se recogerán con journald a través de systemd.
- **Sin tests end-to-end ni de regresión visual**: las capturas en 1920×1080, 1366×768, 1280×720 y 1080×1920 se revisaron manualmente con Chrome headless.

## Despliegue

- El arranque automático en modo kiosk (systemd + Chromium) está documentado en el README, pero no automatizado.
- No se ha medido todavía el consumo real en una Raspberry Pi 3B; la estimación se basa en el tamaño del bundle (~52 KB gzip), la ausencia de animaciones y un único temporizador por segundo.
