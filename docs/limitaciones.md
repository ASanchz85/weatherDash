# Limitaciones y trabajo pendiente del MVP

## Funcionales

- **Sin selector visual de localidad**: la localidad solo se cambia mediante variables de entorno y requiere reiniciar el backend.
- **Geocoding por nombre**: se toma el primer resultado de Open-Meteo dentro de `WEATHER_COUNTRY_CODE`. Para nombres ambiguos conviene fijar `WEATHER_LATITUDE`/`WEATHER_LONGITUDE`.
- **Localidad resuelta en memoria**: si se cambia la configuración hay que reiniciar el servidor; no se persiste nada en disco.
- **Zona horaria del reloj**: el reloj usa la zona horaria del sistema donde corre el navegador, que puede diferir de la de la localidad meteorológica.
- **Predicción semanal**: el primer día se rotula «Hoy» por posición (`forecast[0]`), sin comparar con la fecha actual. Si el backend sirve datos desactualizados o en caché y pasa la medianoche de la localidad, el rotulado puede ir un día por detrás hasta la siguiente actualización correcta. El icono diario usa la variante de día y el código meteorológico diario de Open-Meteo representa la condición más severa del día, no la predominante.
- **Gráfica de las próximas horas**: la primera hora («Ahora») es la hora en curso en el momento en que el backend obtuvo los datos, no la actual. Con la caché (15 minutos por defecto) o con datos desactualizados puede ir por detrás hasta la siguiente actualización. Las horas se leen como texto local de la localidad, sin conversión de zona horaria.
- **Probabilidad de precipitación**: el panel actual usa el valor `current` de Open-Meteo, que es el del intervalo de 15 minutos en curso; la predicción semanal usa el máximo diario y la gráfica horaria el valor de cada hora. Todos pueden ser `null` en algunos modelos y se muestran como «—» o no se dibujan.
- **Colores de sol y lluvia**: se considera «soleado» solo el cielo despejado o mayormente despejado de día; un día parcialmente nublado no se destaca. El código diario de Open-Meteo representa la condición más severa del día, así que un día con un chubasco aislado se pinta en azul aunque sea mayormente soleado. La nieve no tiene color propio.
- **Tema día/noche**: depende de `is_day` de Open-Meteo, no de la hora de orto y ocaso. Se aplica en el siguiente ciclo de rotación (hasta `UI_ROTATION_INTERVAL` después del cambio real), salvo el primer dato tras abrir la página y con la rotación desactivada. Si se abre la página de noche, se muestra un instante la foto de día y se funde a la de noche en cuanto llegan los datos.
- **Calidad del aire**: los datos proceden del modelo CAMS (~11 km) y se cachean al menos una hora. El polen solo tiene cobertura en Europa: llega como `0` fuera de temporada y como `null` si no hay cobertura. Solo se muestra el polen de olivo y gramíneas, sin nivel cualitativo (no hay umbrales de referencia fiables). El índice UV también procede de esta API, así que desaparece si falla su bloque.
- **Reintento tras fallo**: tras un fallo del proveedor el backend espera 1 minuto antes de reintentar (constante `RETRY_AFTER_FAILURE_MS`) y el frontend reintenta cada 30 s (`DATA_RETRY_INTERVAL_MS`); ninguno es configurable por entorno.

## Interfaz

- **Rotación síncrona**: todos los espacios cambian de vista a la vez (un solo temporizador y `UI_ROTATION_INTERVAL` para todos). No se puede fijar una vista concreta ni pausar la rotación en producción; solo `?page=N` (depuración) o `UI_ROTATION_INTERVAL=0`. El panel principal (reloj y foto) no tiene segunda vista.
- **Foto nocturna de poca resolución**: `navaluenga_noche.webp` mide 680×385 (el original tenía una marca de agua, recortada en el propio fichero) y se amplía ~1,8 veces en 1920×1080, por lo que se ve más suave que la de día. Se recorta más que la de día (~10 % frente a ~5 % en horizontal) y bastante en vertical (1080×1920: 40-46 %).
- **Vertical**: en 1080×1920 las fotos se recortan mucho (≥30 %) y el hero cambia de alto según la vista de la card lateral. Es solo un aviso en el script de capturas, no un error.
- **Animación**: solo hay fundidos al cambiar de vista o de tema (0,7 s en total). Con `prefers-reduced-motion` los cambios son instantáneos.
- **Sin persistencia en el navegador**: los datos no se guardan en `sessionStorage` ni `localStorage`. La persistencia es responsabilidad exclusiva del backend, que conserva la última información en memoria y en SQLite y la sirve aunque falle Open-Meteo, no haya red o se reinicie la máquina. Guardar otra copia en el navegador no aportaría nada y obligaría a versionar y caducar el contrato en dos sitios.

## Técnicas

- **Contrato de la API duplicado**: los tipos de `/api/weather` y `/api/air-quality` se definen en el backend (`weather.types.ts`, `air-quality.types.ts`) y en el frontend (`types/weather.ts`, `types/airQuality.ts`). Se optó por no crear un paquete compartido para mantener la simplicidad; con más módulos conviene extraer un workspace `packages/shared`. Con la predicción semanal, `daily` queda duplicado respecto a `forecast[0]`; se mantiene por compatibilidad y puede eliminarse en una iteración posterior.
- **Validación en el frontend**: se valida la respuesta de la API local con validadores manuales (`parseWeatherData`, `parseAirQualityData`, `parseUiConfig`) para no añadir Zod al bundle.
- **`@testing-library/user-event` no instalado**: el MVP no tiene interacción de usuario que probar. Se añadirá cuando exista (p. ej. un selector de localidad).
- **Script `start` del backend**: usa `NODE_ENV=production node …`, sintaxis de shell POSIX. En Windows habría que usar `cross-env` o definir `NODE_ENV` en `.env`.
- **Sin logs en fichero ni rotación**: Fastify registra en stdout en JSON; en Fedora se recogerán con journald a través de systemd.
- **Regresión visual manual asistida**: `npm run screenshots` genera capturas y comprueba scroll, desbordes, solapes y recorte de las dos fotos del hero en 1920×1080, 1366×768, 1280×720, 1600×900, 1280×800 y 1080×1920, con `--query` para cada página y tema (`page`, `theme`). No compara píxeles ni se ejecuta en CI; las capturas se revisan a ojo. Tampoco hay tests end-to-end.

## Despliegue

- `scripts/kiosk.sh` compila y abre Chrome en modo kiosk de forma manual; el arranque automático al iniciar sesión (systemd + autoarranque de Plasma) está documentado en el README, pero no automatizado.
- No se ha medido todavía el consumo real en el equipo Fedora KDE de destino; la estimación se basa en el tamaño del bundle (~57 KB gzip), la ausencia de animaciones continuas y tres temporizadores (el segundo del reloj, el ciclo de datos y la rotación de vistas).
