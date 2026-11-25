# Personal Dashboard

Dashboard personal de uso local, pensado para permanecer abierto en una pantalla mediante Google Chrome en modo kiosk (objetivo: Fedora KDE Plasma). El MVP muestra:

- Fecha y hora local en español, con segundos, en la esquina superior izquierda del panel principal, sobre una foto de día o de noche según la hora real de la localidad.
- Meteorología actual de una localidad configurable (por defecto Navaluenga, Ávila), obtenida de [Open-Meteo](https://open-meteo.com/).
- Viento (con rosa de los vientos), presión, nubosidad y calidad del aire (índice europeo, PM2,5, polvo, polen y UV), también de Open-Meteo.
- Predicción de 7 días (hoy + 6) y gráfica de las próximas 24 horas (temperatura y probabilidad de lluvia) en una franja inferior a ancho completo.

La card lateral y la franja inferior **alternan sus vistas** cada 5 minutos (configurable) con un fundido suave:

| Espacio | Vista 1 | Vista 2 |
| --- | --- | --- |
| Panel principal | Reloj sobre la foto (día o noche) | — |
| Card lateral | Tiempo actual | Viento y calidad del aire |
| Franja inferior | Predicción de 7 días | Próximas 24 horas |

Ideas de mejora futura basadas en Open-Meteo: [`docs/open-meteo-mejoras.md`](docs/open-meteo-mejoras.md).

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
| `npm run screenshots` | Capturas y comprobaciones de layout con Chrome headless (ver [Regresión visual](#regresión-visual)). |
| `scripts/kiosk.sh`  | Compila, arranca el backend en producción y abre Chrome en pantalla completa (modo kiosk). `--skip-build` omite la compilación. |

En desarrollo abre <http://localhost:5173>: Vite reenvía `/api` al backend, por lo que no se necesita CORS. En producción abre <http://localhost:3000>.

### Regresión visual

`scripts/screenshots.mjs` abre la app con Chrome headless en 1920×1080, 1366×768, 1280×720, 1600×900, 1280×800 y 1080×1920, guarda una captura por resolución y comprueba:

- que no hay scroll en horizontal ni contenido desbordado o solapado;
- que el hero sigue usando `background-size: cover` (la imagen no se deforma);
- el recorte de la imagen del hero (error si supera el 25 % en las tres resoluciones horizontales requeridas, aviso en el resto).

```bash
npm run build && npm run start          # en otra terminal
npm run screenshots -- --label=baseline # capturas en /tmp/weatherdash-screenshots/baseline
```

Opciones: `--label` (subcarpeta de salida), `--url` (por defecto `http://localhost:$PORT` o 3000; usa `http://localhost:5173` con `npm run dev`), `--query` (parámetros de URL de depuración, ver más abajo) y `--out` (directorio de salida). Respeta `CHROME_BIN`. Termina con código distinto de 0 si hay errores. Las capturas no se guardan en el repositorio; compara a ojo las de distintas etiquetas.

El hero muestra una foto (de `assets/day` o `assets/night`, o la de la noticia) y el script comprueba su recorte, que solo avisa porque la foto cambia en cada carga. Para revisar todas las variantes tras un cambio de interfaz:

```bash
for query in page=0 page=1 "page=0&theme=day" "page=1&theme=night"; do
  npm run screenshots -- --label="${query//[&=]/-}" --query="$query"
done
```

### Parámetros de depuración

Solo para desarrollo y capturas; se ignoran si no son válidos.

| Parámetro | Efecto |
| --- | --- |
| `?page=N` | Fija la página mostrada (0 = tiempo y semana, 1 = viento y aire y próximas horas) y desactiva la rotación. |
| `?theme=day` / `?theme=night` | Fuerza la foto de día o de noche, sin esperar a los datos ni a la rotación. |
| `?feed=national` / `international` / `economy` / `markets` | Fija la vista de noticias de ese feed (primera noticia) y desactiva la rotación. |

## Configuración (variables de entorno)

El backend lee el fichero `.env` de la raíz del repositorio (ver `.env.example`). Las variables vacías se tratan como no definidas.

| Variable                         | Por defecto     | Descripción                                                                       |
| -------------------------------- | --------------- | --------------------------------------------------------------------------------- |
| `NODE_ENV`                       | `development`   | En `production` el backend sirve `apps/frontend/dist`.                            |
| `PORT`                           | `3000`          | Puerto HTTP del backend.                                                          |
| `HOST`                           | `0.0.0.0`       | Interfaz de escucha. Usa `127.0.0.1` para limitar el acceso al propio equipo.     |
| `DATABASE_PATH`                  | `data/weatherdash.db` | Fichero SQLite donde se conserva la última información. Las rutas relativas parten de la raíz del repositorio; el directorio se crea si no existe. |
| `WEATHER_LOCATION_NAME`          | `Navaluenga`    | Localidad principal (se resuelve con geocoding).                                  |
| `WEATHER_FALLBACK_LOCATION_NAME` | `Ávila`         | Localidad usada si la principal no aparece en el geocoding.                       |
| `WEATHER_COUNTRY`                | `España`        | País mostrado si el geocoding no lo indica o si se usan coordenadas explícitas.   |
| `WEATHER_COUNTRY_CODE`           | `ES`            | Código ISO de dos letras que acota la búsqueda de geocoding.                      |
| `WEATHER_LATITUDE`               | —               | Latitud explícita. Si se define junto a la longitud, no se usa geocoding.         |
| `WEATHER_LONGITUDE`              | —               | Longitud explícita.                                                               |
| `WEATHER_TIMEZONE`               | zona del geocoding | Zona horaria IANA para los extremos diarios (p. ej. `Europe/Madrid`).          |
| `WEATHER_REFRESH_INTERVAL`       | `900000`        | Ciclo de actualización de los datos en ms (mínimo 60000): validez de la caché meteorológica y cadencia con la que el frontend vuelve a consultar. La calidad del aire se cachea al menos 1 hora. |
| `WEATHER_REQUEST_TIMEOUT`        | `8000`          | Timeout de cada petición a Open-Meteo en ms.                                      |
| `UI_ROTATION_INTERVAL`           | `300000`        | Tiempo que dura cada vista del tiempo en ms (5 minutos). `0` desactiva toda la rotación (también las noticias); si no es 0, mínimo 10000. |
| `UI_NEWS_ITEM_DURATION`          | `60000`         | Tiempo que cada noticia permanece resaltada en el hero en ms (1 minuto); mínimo 5000. |
| `UI_PINNED_SCREEN`               | `0`             | Bloquea la pantalla mostrada, sin rotación ni diapositivas (pruebas visuales). `0` muestra todas; opciones: `weather-1` (tiempo y semana), `weather-2` (viento, aire y próximas horas), `news-national`, `news-international`, `news-economy`, `news-markets` (el feed se queda fijo, sin diapositivas, y sus noticias siguen rotando cada `UI_NEWS_ITEM_DURATION`; al terminar la tanda se pide otra del mismo feed). Un valor distinto es un error de configuración. Los parámetros de la URL (`?page`, `?feed`) tienen prioridad. |
| `NEWS_FEED_NATIONAL_URL`         | Europa Press `ch=66`  | RSS de la rotación Nacional.                                              |
| `NEWS_FEED_INTERNATIONAL_URL`    | Europa Press `ch=69`  | RSS de la rotación Internacional.                                         |
| `NEWS_FEED_MARKETS_URL`          | Expansión `mercados.xml` | RSS de la rotación Mercados.                                          |
| `NEWS_FEED_ECONOMY_URL`          | Expansión `economia.xml`  | RSS de la rotación Economía.                                          |
| `NEWS_REFRESH_INTERVAL`          | `3600000`       | Cada cuánto consulta el backend los cuatro feeds en ms (1 hora); mínimo 60000. El timeout es `WEATHER_REQUEST_TIMEOUT`. |
| `NEWS_ROTATION_SIZE`             | `5`             | Noticias de cada rotación de un feed (1-20): las que el backend elige de la base de datos y las que caben en la lista lateral. |

La configuración se valida con Zod al arrancar; un valor inválido detiene el servidor con un mensaje descriptivo.

## Arquitectura

Monorepo con npm workspaces y dos aplicaciones independientes:

```text
apps/
├── backend/                     Fastify + TypeScript
│   └── src/
│       ├── config/              env.ts (validación Zod), paths.ts
│       ├── shared/              cached-resource.ts (caché con petición compartida y datos desactualizados), snapshot-store.ts (contrato de persistencia), service-logger.ts
│       ├── database/            database.ts (apertura de SQLite y migraciones), sqlite-snapshot-storage.ts (última información por recurso)
│       ├── modules/
│       │   ├── health/          GET /api/health
│       │   ├── ui/              GET /api/config (configuración de la interfaz: tiempos de rotación)
│       │   ├── news/            RSS de Europa Press y Expansión: proveedores (parseo; Expansión en `expansion/` con imagen, limpieza de texto, duplicados y adapter), repositorio SQLite, servicio (refresco, retención) y POST /api/news/:feed/rotation
│       │   ├── location/        localidad resuelta una sola vez (geocoding o coordenadas) y compartida
│       │   ├── open-meteo/      cliente HTTP común (timeout, estado HTTP, validación con Zod)
│       │   ├── air-quality/     GET /api/air-quality: proveedor, esquema, servicio (caché ≥ 1 h) y rutas
│       │   └── weather/
│       │       ├── weather.routes.ts    GET /api/weather
│       │       ├── weather.service.ts   caché y datos desactualizados sobre cached-resource
│       │       ├── weather.provider.ts  previsión y geocoding de Open-Meteo + normalización
│       │       ├── weather.schema.ts    esquemas Zod de las respuestas de Open-Meteo
│       │       ├── weather.codes.ts     interpretación de códigos WMO (descripción + icono semántico)
│       │       └── weather.types.ts     modelo interno estable
│       ├── plugins/static.ts    sirve el frontend compilado con fallback SPA
│       ├── app.ts               composición de la aplicación (testeable con inject)
│       └── server.ts            arranque, dotenv y cierre ordenado
└── frontend/                    React 18 + Vite + CSS Modules
    ├── assets/                  fotos del hero en day/ y night/ (solo .webp), vídeo de transición en video/ (.mp4 sin audio) y fuentes JetBrains Mono (subconjunto latino, woff2)
    └── src/
        ├── components/          HeroPanel (foto con fundido, variante de noticias con capa extra y pie de foto), Panel, SidePanel, ForecastPanel (layout), Metric (ficha de medida)
        ├── features/clock/      Clock, useCurrentTime, formateo Intl
        ├── features/dashboard/  useDashboardData: único dueño de la consulta de datos; WeatherDashboard
        ├── features/news/       NewsDashboard, NewsHero, NewsSidePanel, WeatherSummary (reloj + temperatura + rosa de los vientos)
        ├── features/rotation/   useDashboardCycle (ciclo tiempo/noticias), RotatingView (fundido entre vistas), TitleSlide, configuración y parámetros de depuración
        ├── features/theme/     useCommittedTheme (tema día/noche sincronizado con la rotación)
        ├── features/forecast/   WeeklyForecast, HourlyForecast (gráfica de 24 h), formateo
        ├── features/weather/    WeatherPanel, WeatherDetails, WeatherIcon, formateo
        ├── features/wind-air/   WindAirPanel, WindRose (rosa de los vientos), formateo de viento y aire
        ├── services/            weatherApi, airQualityApi, configApi (fetch a la API local + validación en runtime)
        ├── types/               contratos de la API y tema
        └── styles/              estilos globales y tokens de diseño
```

### Decisiones principales

- **Aislamiento del proveedor**: solo `weather.provider.ts` y `air-quality.provider.ts` conocen las URLs, parámetros y formato de Open-Meteo (sobre el cliente común `open-meteo.client.ts`). El resto trabaja con modelos internos como `WeatherSnapshot`. El backend envía un icono semántico (`clear`, `rain`, …) además del código WMO, de modo que el frontend no interpreta códigos del proveedor.
- **Caché en memoria** (`shared/cached-resource.ts`) con validez de `WEATHER_REFRESH_INTERVAL` (la calidad del aire, al menos 1 hora). Las peticiones concurrentes comparten una única llamada al proveedor. Si Open-Meteo falla se devuelve la última información válida con `stale: true`, y no se vuelve a intentar hasta pasado un minuto, para no retrasar cada respuesta con el timeout. Si nunca hubo datos se responde `503` (`WEATHER_UNAVAILABLE` o `AIR_QUALITY_UNAVAILABLE`). Un fallo de la calidad del aire nunca afecta al tiempo.
- **Persistencia de la última información** (SQLite con `better-sqlite3`, sin servidor de base de datos). La tabla `snapshots` tiene una fila por recurso (`weather`, `air-quality`) con el JSON normalizado y el instante en que se obtuvo; cada consulta correcta al proveedor **reemplaza** la fila (no se guarda histórico). Al arrancar, la caché se siembra con esa fila: si sigue vigente se sirve sin consultar a Open-Meteo, y si caducó y no hay red se sirve con `stale: true`. Así hay datos que mostrar aunque la máquina se reinicie sin conexión. Los intervalos de consulta no cambian. La persistencia nunca bloquea el servicio: un error de lectura o escritura se registra y la caché sigue funcionando en memoria. El esquema se versiona con `PRAGMA user_version` y migraciones incrementales (`database/database.ts`); la base de datos usa el modo WAL para tolerar cortes de corriente.
- **Arranque no bloqueante**: la primera consulta de cada módulo se lanza en segundo plano al arrancar; la localidad se resuelve una sola vez, de forma perezosa y compartida, y se reintenta si el geocoding falla.
- **Reloj aislado**: el estado de la hora vive en `Clock`, de modo que su tic de cada segundo no vuelve a renderizar el resto del dashboard. Cada tic se programa con `setTimeout` hasta el siguiente segundo exacto según `Date.now()`, así que los retrasos no se acumulan y solo existe un temporizador. La fecha es un componente memorizado que solo se actualiza cuando cambia el día.
- **Ciclo único de datos**: `useDashboardData` es el único dueño de la consulta. Pide a la vez el tiempo y la calidad del aire (y cada estado se publica en cuanto llega, con errores independientes), y repite el ciclo cuando el servidor indica que su caché caduca: `/api/weather` devuelve `nextRefreshInMs`, calculado en el servidor, y el frontend espera ese tiempo más 1 s. Así la cadencia sigue a `WEATHER_REFRESH_INTERVAL` sin desfases de reloj. Tras un fallo reintenta a los 30 s conservando los últimos datos. Los datos viven en `App`, fuera de las vistas rotatorias: **rotar nunca provoca una consulta**. El frontend no persiste nada en el navegador (ni `localStorage` ni `sessionStorage`): el backend conserva la última información en memoria y en SQLite, responde en milisegundos y la sirve incluso sin red o tras un reinicio.
- **Rotación de vistas**: `useDashboardCycle` es una máquina de estados con un único temporizador por etapa. El ciclo es: vistas del tiempo × 2 vueltas (cada una dura `UI_ROTATION_INTERVAL`) → diapositiva «Nacional» → noticias → vídeo → tiempo × 2 → «Internacional» → noticias → … → «Economía» → «Mercados» → vuelta al inicio. Cada noticia permanece `UI_NEWS_ITEM_DURATION`; al mostrarlas todas termina el feed. La rotación de un feed se pide al backend justo antes de mostrarlo, y si no tiene noticias o falla se salta. Los tiempos se leen en `GET /api/config`, sin recompilar. `RotatingView` funde la vista actual (0,35 s) y después la nueva (0,35 s), también entre el dashboard y las diapositivas, sin fundido con `prefers-reduced-motion`.
- **Noticias**: el backend consulta los cuatro feeds cada `NEWS_REFRESH_INTERVAL` y guarda cada ítem en la tabla `news` con el origen (`feed`: `national`, `international`, `economy` o `markets`), independiente de la categoría que publica el proveedor. Solo se conservan las noticias de hoy y de ayer (según `WEATHER_TIMEZONE`, por defecto `Europe/Madrid`), se descartan las que no traen imagen (`enclosure`) y los duplicados se filtran por URL. `has_been_shown` permite que cada rotación elija las `NEWS_ROTATION_SIZE` noticias más recientes sin mostrar; si quedan menos, se reinicia el estado del feed y se completa con las más recientes ya mostradas. El frontend sustituye `_120` por `_800` en la URL de la foto (solo Europa Press) para pedirla con más resolución.
- **Tema día/noche**: el tema decide la carpeta de fotos del hero (`assets/day` o `assets/night`; cualquier `.webp` que añadas allí se incluye sin tocar código). Con cada rotación del tiempo se elige al azar una foto distinta de la anterior y se funde sobre ella (`useHeroPhoto`). El tema depende de `is_day`: el primer dato válido y la rotación desactivada se aplican al instante; un cambio posterior espera al siguiente ciclo de rotación, para que la foto y las vistas cambien a la vez. Solo cambia la foto: los colores se mantienen.
- **Colores con significado**: el azul (`--color-rain`) se reserva para la lluvia y el naranja para el sol. Un icono es azul si la condición incluye lluvia (llovizna, lluvia, aguanieve, chubascos y tormenta, de día o de noche) y naranja si es cielo despejado o mayormente despejado de día (`weatherTone`). La predicción semanal colorea el icono y la probabilidad de lluvia (azul), y la gráfica horaria dibuja las barras de lluvia en azul. El resalte sutil de «Hoy» y de la ficha de sensación comparte los tokens `--highlight-*`.
- **Color de las temperaturas** (`temperatureTone`, tokens `--temp-*`), igual en la card lateral, la predicción semanal, la gráfica horaria y el resumen de las noticias; se evalúa sobre el valor redondeado que se muestra y el blanco es el color por defecto: > 36° rojo, > 29° naranja, > 22° amarillo, < 12° azul, < 5° azul oscuro y < 0° morado.
- **Frontend resiliente**: un error meteorológico nunca afecta al reloj.
- **Layout y resoluciones**: `DashboardLayout.module.css` usa una cuadrícula de dos filas (hero y card lateral arriba, franja inferior a ancho completo debajo) y apila todo en vertical. Las fotos usan `background-size: cover`: conservan su proporción y solo se recortan, sin deformarse. Todas las vistas de la franja inferior comparten la altura `--forecast-content-height` para que rotar no mueva el layout. Tras cualquier cambio de layout ejecuta `npm run screenshots` (ver [Regresión visual](#regresión-visual)).
- **Sin CORS**: en desarrollo se usa el proxy de Vite; en producción todo se sirve desde el mismo origen.
- **Ligero**: bundle JS de ~57 KB gzip; fuentes reducidas de 2,5 MB a 13 KB y 34 KB; fotos en WebP (187 KB y 59 KB); gráficas en SVG propio, sin librerías de gráficos; sin animaciones continuas.

## API

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/config`

Configuración de la interfaz, leída en tiempo de ejecución. Sin caché.

```json
{ "rotationIntervalMs": 300000, "newsItemDurationMs": 60000, "pinnedScreen": null }
```

`rotationIntervalMs = 0` indica que la rotación está desactivada. `pinnedScreen` es `null` o la pantalla fijada con `UI_PINNED_SCREEN` (p. ej. `"news-economy"`).

### `POST /api/news/:feed/rotation`

`:feed` es `national`, `international`, `economy` o `markets` (otro valor responde `404`). Devuelve hasta `size` noticias del feed (`NEWS_ROTATION_SIZE`), las más recientes sin mostrar, y las marca como mostradas; por eso es `POST`. Sin caché.

```json
{
  "feed": "international",
  "size": 5,
  "items": [
    {
      "id": 12,
      "title": "…",
      "link": "https://www.europapress.es/internacional/noticia-….html",
      "description": "…",
      "enclosureUrl": "https://img.europapress.es/fotoweb/fotonoticia_20261124083249_120.jpg",
      "guid": "…",
      "publishedAt": "2026-11-24T07:32:49.000Z",
      "category": "Internacional"
    }
  ]
}
```

`items` queda vacío si el feed no tiene noticias.

### `GET /api/weather`

```json
{
  "location": { "name": "Navaluenga", "country": "España" },
  "current": {
    "temperature": 8.5,
    "apparentTemperature": 6.7,
    "relativeHumidity": 70,
    "windSpeed": 2.2,
    "windDirection": 90,
    "windGusts": 6.1,
    "pressure": 1024.9,
    "cloudCover": 96,
    "precipitationProbability": 0,
    "weatherCode": 1,
    "description": "Mayormente despejado",
    "icon": "mostly-clear",
    "isDay": true
  },
  "daily": { "temperatureMax": 12, "temperatureMin": 0.9, "sunrise": "2026-11-23T08:13", "sunset": "2026-11-23T17:55" },
  "forecast": [
    {
      "date": "2026-11-23",
      "weatherCode": 45,
      "description": "Niebla",
      "icon": "fog",
      "temperatureMax": 12.2,
      "temperatureMin": 0.8,
      "precipitationProbabilityMax": 0
    }
  ],
  "hourly": [
    { "time": "2026-11-23T19:00", "temperature": 7.5, "precipitationProbability": 0, "weatherCode": 1, "icon": "mostly-clear", "isDay": true }
  ],
  "updatedAt": "2026-11-23T11:06:09.136Z",
  "stale": false,
  "nextRefreshInMs": 899822
}
```

`forecast` contiene 7 elementos (hoy + 6 días) y `hourly` 24 (desde la hora en curso); aquí se muestra solo el primero de cada uno. `date` es la fecha local de la localidad (`YYYY-MM-DD`), `time` la hora local (`YYYY-MM-DDTHH:mm`) y el primer elemento de `forecast` es siempre hoy. `daily` equivale a los extremos de `forecast[0]` y se mantiene por compatibilidad. `nextRefreshInMs` es el tiempo hasta el siguiente refresco (o reintento, si `stale` es `true`).

`windDirection` son los grados de los que viene el viento (0 = norte). `windDirection`, `windGusts`, `pressure`, `cloudCover`, `precipitationProbability`, `temperatureMax`, `temperatureMin`, `precipitationProbabilityMax`, `sunrise`, `sunset` y las temperaturas y probabilidades de `hourly` pueden ser `null` si Open-Meteo no los proporciona.

### `GET /api/air-quality`

```json
{
  "europeanAqi": 19,
  "pm25": 3.7,
  "dust": 0,
  "uvIndex": 0,
  "pollen": { "olive": 0, "grass": 0 },
  "updatedAt": "2026-11-23T18:23:36.054Z",
  "stale": false
}
```

Todas las medidas pueden ser `null`. El polen llega a `0` fuera de temporada y a `null` donde el proveedor no tiene cobertura (fuera de Europa). Si no hay datos responde `503` con `{ "error": "AIR_QUALITY_UNAVAILABLE" }`.

## Integración con Europa Press

- Los feeds RSS 2.0 se parsean con `fast-xml-parser` y cada `item` se valida con Zod (`title`, `link`, `enclosure`, `pubDate`; `description`, `guid` y `category` son opcionales). Un ítem inválido o sin imagen se omite sin invalidar el resto del feed.
- Si un feed falla se registra y se conservan las noticias que ya había; los demás feeds se actualizan igualmente.

## Integración con Expansión

- Los feeds de Economía y Mercados (RSS 2.0 con `media:`) se parsean con `fast-xml-parser` y los adapta `modules/news/expansion/`: `expansion.image.ts` (URL de `media:content`, sin transformar; sin imagen se descarta la noticia), `expansion.sanitizer.ts` (quita restos de CDATA, HTML, entidades y caracteres invisibles de titular, descripción y categoría, y valida la fecha), `expansion.dedupe.ts` (normaliza el enlace y descarta duplicados) y `expansion.adapter.ts` (une las piezas y devuelve el formato de la base de datos).
- La descripción sale de `media:description`, la categoría es la primera `<category>` y `guid` cae al enlace si falta. `link` es único en toda la tabla: un artículo que esté en Economía y Mercados solo se muestra en el feed que lo guardó primero.

## Integración con Open-Meteo

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=…&countryCode=ES&language=es&count=1`.
- Previsión: `https://api.open-meteo.com/v1/forecast` con `current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,weather_code,is_day,precipitation_probability`, `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` y `hourly=temperature_2m,precipitation_probability,weather_code,is_day`, con `forecast_days=7`, `forecast_hours=24` y viento en km/h.
- Calidad del aire: `https://air-quality-api.open-meteo.com/v1/air-quality` con `current=european_aqi,pm2_5,dust,uv_index,olive_pollen,grass_pollen`.
- Todas las respuestas se validan con Zod; un formato inesperado se trata como un fallo del proveedor. Las medidas auxiliares (viento, presión, nubosidad y toda la calidad del aire) admiten `null` sin invalidar la respuesta.
- Uso no comercial gratuito y sin API key. Con la caché de 15 minutos el dashboard realiza ~96 peticiones diarias de previsión (cada una cuenta como ~2,1 llamadas por tener 21 variables) y ~24 de calidad del aire (caché de 1 hora): unas 225 llamadas al día, muy por debajo del límite de 10.000.

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

- `apps/frontend/assets/video/*.mp4`: vídeo de 10 s que se reproduce completo, sin sonido ni controles, al volver al tiempo desde las noticias (sustituye a la diapositiva «Tiempo»). Se usa el primer `.mp4` de la carpeta; sin ninguno, vuelve la diapositiva. Si no llega a terminar, el ciclo sigue a los 15 s.
- `apps/frontend/assets/day/*.webp` y `apps/frontend/assets/night/*.webp`: fotos del hero, oscurecidas con un degradado CSS (en las noticias, con una capa extra). Formato unificado en WebP con 1920 px de ancho como máximo. Algunas tienen poca resolución o formato vertical y se amplían o recortan en pantallas grandes; sustitúyelas por versiones apaisadas de mayor resolución si dispones de ellas.
- `apps/frontend/assets/fonts/*.woff2`: subconjunto latino (Basic Latin + Latin-1) de JetBrains Mono Regular y Bold, generado con `pyftsubset` de fontTools. Para regenerarlo hacen falta los TTF originales, que ya no se incluyen en el repositorio.

Las limitaciones conocidas están en [`docs/limitaciones.md`](docs/limitaciones.md).
