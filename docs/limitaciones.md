# Limitaciones y trabajo pendiente del MVP

## Funcionales

- **Sin selector visual de localidad**: la localidad solo se cambia mediante variables de entorno y requiere reiniciar el backend.
- **Geocoding por nombre**: se toma el primer resultado de Open-Meteo dentro de `WEATHER_COUNTRY_CODE`. Para nombres ambiguos conviene fijar `WEATHER_LATITUDE`/`WEATHER_LONGITUDE`.
- **Localidad resuelta en memoria**: si se cambia la configuración hay que reiniciar el servidor; no se persiste nada en disco.
- **Zona horaria del reloj**: el reloj usa la zona horaria del sistema donde corre el navegador, que puede diferir de la de la localidad meteorológica.
- **Predicción semanal**: el primer día se rotula «Hoy» por posición (`forecast[0]`), sin comparar con la fecha actual. Si el backend sirve datos desactualizados o en caché y pasa la medianoche de la localidad, el rotulado puede ir un día por detrás hasta la siguiente actualización correcta. El icono diario usa la variante de día y el código meteorológico diario de Open-Meteo representa la condición más severa del día, no la predominante.
- **Probabilidad de precipitación**: el panel actual usa el valor `current` de Open-Meteo, que es el del intervalo de 15 minutos en curso; la predicción semanal usa el máximo diario. Ambos pueden ser `null` en algunos modelos y se muestran como «—».
- **Reintento tras fallo**: tras un fallo del proveedor se espera 1 minuto antes de reintentar (constante `RETRY_AFTER_FAILURE_MS`); no es configurable por entorno.

## Técnicas

- **Contrato de la API duplicado**: los tipos de `/api/weather` se definen en el backend (`weather.types.ts`) y en el frontend (`types/weather.ts`). Se optó por no crear un paquete compartido para mantener la simplicidad; si el contrato crece conviene extraer un workspace `packages/shared`. Con la predicción semanal, `daily` queda duplicado respecto a `forecast[0]`; se mantiene por compatibilidad y puede eliminarse en una iteración posterior.
- **Validación en el frontend**: se valida la respuesta de la API local con un validador manual (`parseWeatherData`) para no añadir Zod al bundle.
- **`@testing-library/user-event` no instalado**: el MVP no tiene interacción de usuario que probar. Se añadirá cuando exista (p. ej. un selector de localidad).
- **Script `start` del backend**: usa `NODE_ENV=production node …`, sintaxis de shell POSIX. En Windows habría que usar `cross-env` o definir `NODE_ENV` en `.env`.
- **Sin logs en fichero ni rotación**: Fastify registra en stdout en JSON; en Fedora se recogerán con journald a través de systemd.
- **Regresión visual manual asistida**: `npm run screenshots` genera capturas y comprueba scroll, desbordes y recorte de la imagen del hero en 1920×1080, 1366×768, 1280×720, 1600×900, 1280×800 y 1080×1920, pero no compara píxeles ni se ejecuta en CI; las capturas se revisan a ojo. Tampoco hay tests end-to-end.

## Despliegue

- `scripts/kiosk.sh` compila y abre Chrome en modo kiosk de forma manual; el arranque automático al iniciar sesión (systemd + autoarranque de Plasma) está documentado en el README, pero no automatizado.
- No se ha medido todavía el consumo real en el equipo Fedora KDE de destino; la estimación se basa en el tamaño del bundle (~53 KB gzip), la ausencia de animaciones y un único temporizador por segundo.
