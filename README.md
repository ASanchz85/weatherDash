# Personal Dashboard

Dashboard personal de uso local, pensado para permanecer abierto en una pantalla mediante Google Chrome en modo kiosk (objetivo: Fedora KDE Plasma). El MVP muestra:

- Fecha y hora local en español, con segundos.
- Meteorología actual de una localidad configurable (por defecto Navaluenga, Ávila), obtenida de [Open-Meteo](https://open-meteo.com/).

## Requisitos previos

- Node.js 22 LTS o superior (probado con 22.23).
- npm 10 o superior.
- Google Chrome (solo para el modo kiosk).
- `curl` (lo usa `scripts/kiosk.sh` para esperar al backend).
- Acceso a Internet desde el backend para consultar Open-Meteo (no requiere API key).

### Fedora KDE Plasma

Todas las dependencias están en los repositorios oficiales. No hace falta toolchain de compilación (`gcc`, `make`, `python3`): el proyecto no tiene módulos nativos y `esbuild`/`rollup` se instalan como binarios precompilados.

```bash
# Node.js 22 y npm (Fedora empaqueta versiones paralelas: nodejs20, nodejs22, nodejs24…)
sudo dnf install nodejs22 nodejs22-npm nodejs22-full-i18n curl

# Google Chrome: activar el repositorio de terceros de Fedora e instalarlo
sudo dnf install fedora-workstation-repositories
sudo dnf config-manager setopt google-chrome.enabled=1
sudo dnf install google-chrome-stable
```

- `nodejs22-full-i18n` aporta los datos ICU completos. Sin ellos, el formateo `Intl` en español (`es-ES`) de los tests de Vitest puede caer a inglés.
- Si prefieres no usar el repositorio de Google, Chromium (`sudo dnf install chromium`) también sirve: `CHROME_BIN=chromium-browser scripts/kiosk.sh`.
- Plasma 6 usa Wayland por defecto; el script lanza Chrome con `--ozone-platform-hint=auto` para que funcione de forma nativa en Wayland (y en X11 si se usa).

## Instalación

```bash
npm install
cp .env.example .env   # y ajusta los valores si es necesario
```

## Ejecución

| Comando             | Descripción                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Backend (`tsx watch`, puerto 3000) y frontend (Vite, puerto 5173) a la vez.   |
| `npm run build`     | Compila frontend (`apps/frontend/dist`) y backend (`apps/backend/dist`).      |
| `npm run start`     | Backend en producción sirviendo el frontend compilado (requiere `build`).     |
| `npm run test`      | Pruebas de ambos proyectos con Vitest.                                       |
| `npm run typecheck` | Comprobación de tipos de ambos proyectos.                                    |
| `scripts/kiosk.sh`  | Compila, arranca el backend en producción y abre Chrome en pantalla completa (modo kiosk). `--skip-build` omite la compilación. |

En desarrollo abre <http://localhost:5173>: Vite reenvía `/api` al backend, por lo que no se necesita CORS. En producción abre <http://localhost:3000>.

## Configuración (variables de entorno)

El backend lee el fichero `.env` de la raíz del repositorio (ver `.env.example`). Las variables vacías se tratan como no definidas.

| Variable                         | Por defecto     | Descripción                                                                       |
| -------------------------------- | --------------- | --------------------------------------------------------------------------------- |
| `NODE_ENV`                       | `development`   | En `production` el backend sirve `apps/frontend/dist`.                            |
| `PORT`                           | `3000`          | Puerto HTTP del backend.                                                          |
| `HOST`                           | `0.0.0.0`       | Interfaz de escucha. Usa `127.0.0.1` para limitar el acceso al propio equipo.     |
| `WEATHER_LOCATION_NAME`          | `Navaluenga`    | Localidad principal (se resuelve con geocoding).                                  |
| `WEATHER_FALLBACK_LOCATION_NAME` | `Ávila`         | Localidad usada si la principal no aparece en el geocoding.                       |
| `WEATHER_COUNTRY`                | `España`        | País mostrado si el geocoding no lo indica o si se usan coordenadas explícitas.   |
| `WEATHER_COUNTRY_CODE`           | `ES`            | Código ISO de dos letras que acota la búsqueda de geocoding.                      |
| `WEATHER_LATITUDE`               | —               | Latitud explícita. Si se define junto a la longitud, no se usa geocoding.         |
| `WEATHER_LONGITUDE`              | —               | Longitud explícita.                                                               |
| `WEATHER_TIMEZONE`               | zona del geocoding | Zona horaria IANA para los extremos diarios (p. ej. `Europe/Madrid`).          |
| `WEATHER_REFRESH_INTERVAL`       | `900000`        | Validez de la caché meteorológica en ms (mínimo 60000).                           |
| `WEATHER_REQUEST_TIMEOUT`        | `8000`          | Timeout de cada petición a Open-Meteo en ms.                                      |

La configuración se valida con Zod al arrancar; un valor inválido detiene el servidor con un mensaje descriptivo.

## Arquitectura

Monorepo con npm workspaces y dos aplicaciones independientes:

```text
apps/
├── backend/                     Fastify + TypeScript
│   └── src/
│       ├── config/              env.ts (validación Zod), paths.ts
│       ├── modules/
│       │   ├── health/          GET /api/health
│       │   └── weather/
│       │       ├── weather.routes.ts    GET /api/weather
│       │       ├── weather.service.ts   caché, deduplicación, localidad, datos desactualizados
│       │       ├── weather.provider.ts  cliente Open-Meteo + normalización (único punto que conoce Open-Meteo)
│       │       ├── weather.schema.ts    esquemas Zod de las respuestas de Open-Meteo
│       │       ├── weather.codes.ts     interpretación de códigos WMO (descripción + icono semántico)
│       │       └── weather.types.ts     modelo interno estable
│       ├── plugins/static.ts    sirve el frontend compilado con fallback SPA
│       ├── app.ts               composición de la aplicación (testeable con inject)
│       └── server.ts            arranque, dotenv y cierre ordenado
└── frontend/                    React 18 + Vite + CSS Modules
    ├── assets/                  imagen del hero y fuentes JetBrains Mono (subconjunto latino, woff2)
    └── src/
        ├── components/          HeroPanel, SidePanel (layout)
        ├── features/clock/      Clock, useCurrentTime, formateo Intl
        ├── features/weather/    WeatherPanel, WeatherDetails, WeatherIcon, useWeather, formateo
        ├── services/            weatherApi (fetch a la API local + validación en runtime)
        ├── types/               contrato de la API
        └── styles/              estilos globales y tokens de diseño
```

### Decisiones principales

- **Aislamiento del proveedor**: solo `weather.provider.ts` conoce las URLs, parámetros y formato de Open-Meteo. El resto trabaja con `WeatherSnapshot`. El backend envía un icono semántico (`clear`, `rain`, …) además del código WMO, de modo que el frontend no interpreta códigos del proveedor.
- **Caché en memoria** con validez de `WEATHER_REFRESH_INTERVAL`. Las peticiones concurrentes comparten una única llamada al proveedor. Si Open-Meteo falla se devuelve la última información válida con `stale: true`, y no se vuelve a intentar hasta pasado un minuto, para no retrasar cada respuesta con el timeout. Si nunca hubo datos se responde `503` con `{ "error": "WEATHER_UNAVAILABLE" }`.
- **Arranque no bloqueante**: la primera consulta se lanza en segundo plano al arrancar; la localidad se resuelve de forma perezosa y se reintenta si el geocoding falla.
- **Reloj aislado**: el estado de la hora vive en `Clock`, de modo que su tic de cada segundo no vuelve a renderizar el resto del dashboard. Cada tic se programa con `setTimeout` hasta el siguiente segundo exacto según `Date.now()`, así que los retrasos no se acumulan y solo existe un temporizador. La fecha es un componente memorizado que solo se actualiza cuando cambia el día.
- **Frontend resiliente**: `useWeather` consulta la API local cada 5 minutos (cada 30 s tras un error) y conserva los últimos datos si una consulta falla. Un error meteorológico nunca afecta al reloj.
- **Sin CORS**: en desarrollo se usa el proxy de Vite; en producción todo se sirve desde el mismo origen.
- **Ligero**: bundle JS de ~52 KB gzip; fuentes reducidas de 2,5 MB a 13 KB y 34 KB; sin animaciones.

## API

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/weather`

```json
{
  "location": { "name": "Navaluenga", "country": "España" },
  "current": {
    "temperature": 8.5,
    "apparentTemperature": 6.7,
    "relativeHumidity": 70,
    "windSpeed": 2.2,
    "precipitationProbability": 0,
    "weatherCode": 1,
    "description": "Mayormente despejado",
    "icon": "mostly-clear",
    "isDay": true
  },
  "daily": { "temperatureMax": 12, "temperatureMin": 0.9 },
  "updatedAt": "2026-11-23T11:06:09.136Z",
  "stale": false
}
```

`precipitationProbability`, `temperatureMax` y `temperatureMin` pueden ser `null` si Open-Meteo no los proporciona.

## Integración con Open-Meteo

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=…&countryCode=ES&language=es&count=1`.
- Previsión: `https://api.open-meteo.com/v1/forecast` con `current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,precipitation_probability` y `daily=temperature_2m_max,temperature_2m_min`, `forecast_days=1`, viento en km/h.
- Todas las respuestas se validan con Zod; un formato inesperado se trata como un fallo del proveedor.
- Uso no comercial gratuito y sin API key. Con la caché de 15 minutos el dashboard realiza ~96 peticiones diarias, muy por debajo de los límites.

## Modo kiosk (Fedora KDE Plasma)

### Ejecución manual

```bash
scripts/kiosk.sh              # npm run build + backend en producción + Chrome a pantalla completa
scripts/kiosk.sh --skip-build # reutiliza la compilación existente
```

El script instala dependencias si falta `node_modules`, espera a que `/api/health` responda y abre Chrome con `--kiosk` sobre `http://localhost:<PORT>`. Usa un perfil de Chrome propio (`~/.cache/weatherdash-kiosk`) para que el modo kiosk funcione aunque Chrome ya esté abierto con el perfil habitual. Se sale con `Alt+F4`; al cerrarse Chrome (o con `Ctrl+C`) se detiene también el backend. Variables opcionales: `CHROME_BIN` (navegador) y `PORT`.

### Arranque automático (no automatizado todavía)

1. Instalar las dependencias de [Fedora KDE Plasma](#fedora-kde-plasma).
2. Copiar el proyecto, `npm ci`, `npm run build` y, opcionalmente, `npm prune --omit=dev` para reducir espacio.
3. Ejecutar el backend como servicio systemd, por ejemplo `/etc/systemd/system/dashboard.service` (sustituye `<usuario>`):

   ```ini
   [Unit]
   Description=Personal Dashboard
   After=network-online.target
   Wants=network-online.target

   [Service]
   WorkingDirectory=/home/<usuario>/WeatherDash
   ExecStart=/usr/bin/node apps/backend/dist/server.js
   Environment=NODE_ENV=production
   Environment=HOST=127.0.0.1
   Restart=always
   User=<usuario>

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload && sudo systemctl enable --now dashboard.service
   ```

   Si SELinux impide ejecutar el servicio desde `/home`, revisa `sudo ausearch -m avc -ts recent` o instala el proyecto en `/opt`.

4. Lanzar Chrome al iniciar la sesión de Plasma: *Preferencias del sistema → Arranque y apagado → Autoarranque → Añadir aplicación*, o crear `~/.config/autostart/dashboard-kiosk.desktop`:

   ```ini
   [Desktop Entry]
   Type=Application
   Name=Dashboard kiosk
   Exec=google-chrome-stable --kiosk --ozone-platform-hint=auto --user-data-dir=%h/.cache/weatherdash-kiosk --no-first-run --noerrdialogs --disable-infobars --disable-translate --disable-session-crashed-bubble --check-for-update-interval=31536000 http://localhost:3000
   X-KDE-autostart-phase=2
   ```

   (Si no se usa el servicio systemd, el `Exec` puede apuntar directamente a `scripts/kiosk.sh --skip-build`.)

5. Evitar que la pantalla se bloquee o se apague: en *Preferencias del sistema → Bloqueo de pantalla* desactivar el bloqueo automático, y en *Energía* desactivar el apagado de pantalla y la suspensión. Para iniciar sin contraseña, activar el inicio de sesión automático en *Preferencias del sistema → Inicio de sesión (SDDM)*.
6. Ocultar el cursor: `unclutter` solo funciona en X11, no en la sesión Wayland por defecto de Plasma. La opción más sencilla es dejar el equipo sin ratón conectado o mover el cursor a un borde de la pantalla.

## Fuentes y recursos

- `apps/frontend/assets/navaluenga.webp`: imagen del hero (oscurecida con un degradado CSS).
- `apps/frontend/assets/fonts/*.woff2`: subconjunto latino (Basic Latin + Latin-1) de JetBrains Mono Regular y Bold, generado con `pyftsubset` de fontTools. Para regenerarlo hacen falta los TTF originales, que ya no se incluyen en el repositorio.

Las limitaciones conocidas están en [`docs/limitaciones.md`](docs/limitaciones.md).
