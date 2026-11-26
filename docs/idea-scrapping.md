# Idea: scraping de diainternacionalde.com

Consideraciones recogidas al diseñar un scraping diario de [diainternacionalde.com](https://www.diainternacionalde.com/). **No está implementado**: por ahora solo se usan la fase lunar (calculada en el frontend) y las efemérides (API de Wikipedia). Este documento conserva el diseño por si se retoma.

## Objetivo

Obtener cada día, desde el backend a las 00:10 (hora local), y guardar en SQLite para servirlo desde la API local:

- Días internacionales y mundiales.
- Semanas internacionales.
- Santoral.
- Frase del día.
- Fase lunar.
- (Efemérides históricas: se resolvieron con Wikipedia, ver [Por qué Wikipedia para las efemérides](#por-qué-wikipedia-para-las-efemérides).)

## Hallazgos sobre la web

- `robots.txt` solo declara `User-agent: *` sin `Disallow`.
- El contenido llega en el HTML del servidor; el aviso de consentimiento es del lado del cliente. Basta un `GET` con un User-Agent descriptivo, sin navegador.
- El carrusel de días de la portada muestra solo 5 y su fecha aparece junto a los enlaces de forma ambigua. Es más fiable leer el listado mensual «Días Internacionales y Mundiales en {mes}» y filtrar por el día de hoy.
- El bloque «Semanas internacionales» de la portada incluye semanas que ya terminaron (el 26-nov listaba la del 18–24 nov). Hay que leer el listado mensual de semanas, que trae el rango («Este año se celebra del 21 de noviembre al 29 de noviembre de 2026»), y quedarse con las que contienen hoy.
- Fase lunar: texto del tipo «Hoy hay Luna Menguante (97.38% iluminada). La próxima Luna llena será el 24 de diciembre, faltan 28 días». El nombre es grueso (el 97 % es una gibosa menguante); la fase fina se deriva de la dirección y el porcentaje.
- Santoral: «Festividad de Cristo Rey, San Conrado y San Delfín». Frase: texto con el autor entre paréntesis al final.
- Las efemérides de la portada son solo una selección; la página `/efemerides/{mes}/{dia}` trae más, pero se descartó esta fuente.

## Endpoints propuestos

Revisión semántica respecto a lo que ya existe (`/api/weather`, `/api/air-quality`, `POST /api/news/:feed/rotation`): `today` y `week` mezclan tiempo con tipo de contenido y `commemorations` se confunde con los días internacionales (que también son conmemoraciones). Nomenclatura plural, por contenido:

| Endpoint | Contenido |
| --- | --- |
| `GET /api/calendar/international-days` | Días internacionales y mundiales de hoy |
| `GET /api/calendar/international-weeks` | Semanas internacionales en curso |
| `GET /api/calendar/moon` | Fase lunar |
| `GET /api/calendar/quote` | Frase del día |
| `GET /api/calendar/saints` | Santoral |
| `GET /api/calendar` | Las cinco anteriores en una sola petición |

- Son `GET` idempotentes con `Cache-Control: no-store` (a diferencia de las noticias, no marcan nada como mostrado).
- Devuelven `date` (la fecha del dato) y `stale` (`date` distinto de hoy). Sin ningún dato, `503` (`CALENDAR_UNAVAILABLE`), igual que el tiempo.

## Base de datos

Una tabla por sección, todas `STRICT` y con `calendar_date` (YYYY-MM-DD local), añadidas como migración nueva en `database.ts`:

- `calendar_international_days` y `calendar_international_weeks` (esta con `start_date` y `end_date`): nombre, URL de la ficha y posición.
- `calendar_saints`, `calendar_quote` (texto y autor) y `calendar_moon` (fase, iluminación, creciente o menguante, próxima luna llena y días hasta ella).
- `calendar_sync`: sección, fecha objetivo, intentos, último intento y último error.

Reemplazo al éxito: por sección, `DELETE` + `INSERT` en una transacción **solo si el parseo fue correcto**. Si falla, se conserva el dato anterior (con `stale` en la API). Antes de guardar se limpia todo a texto plano (sin HTML, entidades, CDATA ni caracteres invisibles), reutilizando `cleanText` de `modules/news/expansion/expansion.sanitizer.ts`.

## Planificación y reintentos

- Planificador diario sin dependencias (no `node-cron`): ejecuta la tarea a las 00:10 en la zona horaria configurada, con reloj y temporizadores inyectables para los tests.
- Si la tarea queda incompleta o falla, reintenta cada 10 minutos hasta el fin del día local; a las 00:10 siguientes toma el relevo.
- Catch-up al arrancar: si ya pasó la hora y falta el dato de hoy, se ejecuta de inmediato (un kiosco apagado a las 00:10 no se queda sin datos).
- El servicio calcula las secciones pendientes (sin filas para la fecha de hoy) y solo descarga las páginas que hacen falta; cada sección se procesa de forma independiente.

Variables previstas: `CALENDAR_SYNC_TIME` (`00:10`), `CALENDAR_RETRY_INTERVAL` (`600000`, mínimo `60000`) y `CALENDAR_BASE_URL`.

## Scraper

- Dependencia nueva: `cheerio` en el backend.
- Parsers puros por sección, anclados al texto de las cabeceras («SANTORAL HOY», «FRASE DEL DÍA»…) y no a clases CSS, que cambian con más frecuencia.
- Validación previa: la cabecera «Hoy N de mes» de la página debe coincidir con la fecha local; si no, la página se rechaza (evita guardar una página cacheada de otro día).
- Una sección ausente se registra como aviso; las semanas pueden estar vacías legítimamente.
- Fase fina de la luna: dirección (creciente o menguante) más porcentaje, con umbrales en una función pura testeada.

## Tests

- Fixtures HTML reales recortadas (capturadas con `curl`).
- Parsers por sección, repositorio (el reemplazo conserva datos si falla el parseo), servicio (fallo parcial y reintento) y planificador con temporizadores falsos (catch-up, reintento a los 10 min, cambio de día).
- Rutas con `app.inject`.

## Riesgos

- Dependencia del HTML de un tercero: un rediseño rompe el scraping sin avisar. Los tests con fixtures lo detectan solo si se actualizan.
- Términos de uso: uso personal, 1–2 peticiones al día, User-Agent descriptivo y atribución visible.
- Semanas a caballo entre meses (por ejemplo del 28-nov al 4-dic): el listado de diciembre podría no incluir una semana que empezó en noviembre; habría que leer también el mes anterior.

## Por qué Wikipedia para las efemérides

La API «On this day» de es.wikipedia.org devuelve año, texto y páginas relacionadas con miniatura e imagen original por evento, sin clave y sin scraping. Permite quedarse solo con eventos con fotografía y se integra como un feed más de noticias.
