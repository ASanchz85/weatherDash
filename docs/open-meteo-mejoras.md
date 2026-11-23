# Ideas de mejora basadas en Open-Meteo

Documento de investigación para iterar sobre el dashboard. No describe trabajo comprometido: cada idea indica variables, endpoint, coste en llamadas y esfuerzo para poder priorizar. Las URLs de ejemplo usan Navaluenga (`latitude=40.41123`, `longitude=-4.70897`, `timezone=Europe/Madrid`).

Estado de verificación: **Verificado** significa que se consultó la API real para Navaluenga el 2026-11-23; **Por verificar** significa que solo se ha leído la documentación.

Estado de implementación: las ideas marcadas como **Implementado** ya están en la app (ver el [README](../README.md)); el resto sigue siendo investigación.

## 1. Qué usa la app hoy

| Endpoint | Variables | Uso |
| --- | --- | --- |
| `api.open-meteo.com/v1/forecast` | `current`: `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `pressure_msl`, `cloud_cover`, `weather_code`, `is_day`, `precipitation_probability`; `daily`: `weather_code`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_probability_max`, `sunrise`, `sunset`; `hourly`: `temperature_2m`, `precipitation_probability`, `weather_code`, `is_day`; `forecast_days=7`, `forecast_hours=24` | Card lateral (tiempo y viento), franja inferior (semana y horas) y tema día/noche |
| `air-quality-api.open-meteo.com/v1/air-quality` | `current`: `european_aqi`, `pm2_5`, `dust`, `uv_index`, `olive_pollen`, `grass_pollen` | Vista «Viento y aire» |
| `geocoding-api.open-meteo.com/v1/search` | `name`, `countryCode`, `language=es`, `count=1` | Resolver la localidad al arrancar |

La previsión semanal (iteración en curso) amplía `daily` con `weather_code` y `precipitation_probability_max`, y sube a `forecast_days=7`.

## 2. Límites y coste en llamadas

Plan gratuito, sin API key y solo para uso no comercial, suficiente para esta app personal:

| Límite | Valor |
| --- | --- |
| Por minuto / hora / día / mes | 600 / 5.000 / 10.000 / 300.000 llamadas |

No todas las peticiones cuentan como una llamada. Según la página de precios, una petición con más de 10 variables o con un rango de más de 2 semanas cuenta de forma fraccionada. Aproximación útil para planificar:

$$\text{coste} \approx \max\left(1, \frac{\text{variables}}{10}\right) \times \max\left(1, \frac{\text{días}}{14}\right)$$

- Antes de la previsión semanal: 9 variables × 1 día → 1 llamada por consulta.
- Hoy: 21 variables (11 actuales, 6 diarias y 4 horarias) × 7 días → ~2,1 llamadas por consulta de previsión, más 1 de calidad del aire (6 variables).
- Con la caché de 15 minutos son 96 consultas de previsión al día (~202 llamadas) y ~24 de calidad del aire (caché de al menos 1 hora): unas 225 llamadas diarias en total. Cada endpoint nuevo consultado con ritmo de 15 minutos suma ~96 llamadas/día; con TTL mayores, menos. El uso queda muy por debajo de las 10.000 diarias.
- Atención al histórico: un rango de varios años cuenta como cientos de llamadas (ver 4.4); debe pedirse una vez al día como máximo y cachearse.

## 3. Mejoras con el mismo endpoint de previsión

Coste adicional: ninguno o fraccionado. Son las de mejor relación valor/esfuerzo porque solo tocan `DAILY_FIELDS`/`CURRENT_FIELDS`, el esquema Zod y el contrato.

### 3.1 Variables diarias adicionales (`daily=`)

| Variable | Unidad | Idea de uso |
| --- | --- | --- |
| `sunrise`, `sunset` | ISO 8601 | Mostrar orto y ocaso; decidir el tema día/noche con datos reales en lugar de `is_day` |
| `uv_index_max` | índice | Aviso cuando el índice UV sea alto |
| `precipitation_sum`, `precipitation_hours` | mm, horas | Complementar el porcentaje con cantidad esperada en cada día de la semana |
| `wind_gusts_10m_max`, `wind_speed_10m_max` | km/h | Aviso de rachas fuertes |
| `wind_direction_10m_dominant` | ° | Dirección dominante del día |
| `apparent_temperature_max`, `apparent_temperature_min` | °C | Sensación térmica extrema del día |
| `sunshine_duration`, `daylight_duration` | s | Horas de sol frente a horas de luz |

`weather_code` diario es la condición más severa del día, no la predominante: puede mostrar lluvia en un día mayormente soleado.

### 3.2 Variables actuales adicionales (`current=`) — Implementado

Verificado: `pressure_msl` (1024,9 hPa), `wind_direction_10m` (90°), `cloud_cover` (96 %) y `wind_gusts_10m` (6,1 km/h). La app muestra la dirección con una rosa de los vientos, las rachas junto al viento, y la presión y la nubosidad en fichas (vista «Viento y aire»). Queda pendiente la tendencia de la presión.

- Dirección del viento con rosa/flecha junto a la velocidad actual.
- Presión y tendencia (comparando con la hora anterior en datos horarios).
- Racha máxima junto al viento medio.

### 3.3 Datos horarios (`hourly=`) — Implementado

La franja inferior alterna con una gráfica de las próximas 24 horas (línea de temperatura y barras de probabilidad de lluvia) en SVG propio, con `forecast_hours=24` y las variables `temperature_2m`, `precipitation_probability`, `weather_code` e `is_day` (estas dos permiten resaltar las horas soleadas y de lluvia). Quedan sin usar `precipitation`, `cloud_cover`, `pressure_msl` y `visibility` por hora.

- Gráfica de temperatura de las próximas 24 h y barras de probabilidad de lluvia, como las secciones "Today temperature" y "Rain chances" de la referencia visual ([weather_dash_example.webp](weather_dash_example.webp)). Variables: `temperature_2m`, `precipitation_probability`, `precipitation`.
- Se limita el volumen con `forecast_hours=24` en lugar de `forecast_days`.
- Dibujarla con SVG propio, sin librería de gráficos, por el criterio de bundle ligero del proyecto.

### 3.4 Otras opciones del endpoint

- `timeformat=unixtime`: hace robustos los instantes ante cambios de horario de verano, porque con ISO 8601 el desfase `utc_offset_seconds` se fija en el momento de la petición. Útil si se muestran horas de orto/ocaso o series horarias.
- `utc_offset_seconds` (siempre devuelto): permite calcular de forma fiable qué día es "hoy" en la localidad, cerrando la limitación actual de que el reloj usa la zona horaria del navegador.
- `minutely_15` (p. ej. `precipitation`): Verificado que responde para Navaluenga. Según la documentación, fuera de Europa central y Norteamérica los datos son una interpolación de los horarios, por lo que aporta poco para un aviso de "lluvia en la próxima hora". Prioridad baja.
- `models`: por defecto `best_match` combina el mejor modelo disponible. Elegir ECMWF IFS o ICON a mano solo tiene sentido si se quiere comparar modelos. Prioridad baja.
- `elevation`: la respuesta ya incluye la elevación de la celda (764 m para Navaluenga). Solo habría que forzarla si el punto de la localidad estuviera muy por encima o por debajo de su celda. Descartable.

## 4. Otras APIs de Open-Meteo

Cada API tiene su propio host y comparte formato y parámetros con la de previsión. Todas son gratuitas para uso no comercial.

### 4.1 Calidad del aire y polen (Verificado) — Implementado

- Endpoint: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=…&longitude=…&current=european_aqi,pm2_5,dust,olive_pollen,grass_pollen,uv_index`
- Respuesta real para Navaluenga: `european_aqi` 22 (aceptable; la escala va de 0-20 bueno a más de 100 extremadamente malo), `pm2_5` 2,6 µg/m³, `dust` 0,0, polen de olivo y gramíneas 0,0 granos/m³, `uv_index` 2,45. El intervalo de `current` es de 3.600 s.
- Variables disponibles: `european_aqi` (y por contaminante), `us_aqi`, `pm10`, `pm2_5`, `ozone`, `nitrogen_dioxide`, `dust` (polvo del Sáhara, relevante en España), `uv_index`, `aerosol_optical_depth`, y pólenes de aliso, abedul, gramíneas, artemisa, olivo y ambrosía (solo Europa y en temporada).
- Datos: CAMS europeo a ~11 km, actualizado cada 24 h; el global, cada 12 h.
- Caché sugerida: 1 a 3 horas. Coste: una consulta más por ciclo, bien por debajo del límite.
- Idea: tarjeta o indicador discreto con el índice de calidad del aire y, solo en temporada, el polen de olivo y gramíneas.
- Verificado después: fuera de temporada el polen llega como `0,0` (Navaluenga, noviembre) y fuera de Europa como `null`, tanto en `current` como en `hourly`. La app lo muestra como «Sin polen» y «—» respectivamente. Implementado en la vista «Viento y aire»: índice con su nivel, PM2,5, polvo, polen (especie dominante) y UV; la caché es `max(WEATHER_REFRESH_INTERVAL, 1 h)` y no afecta a la previsión si falla.

### 4.2 Caudal del río (Flood API) (Verificado)

- Endpoint: `https://flood-api.open-meteo.com/v1/flood?latitude=…&longitude=…&daily=river_discharge&forecast_days=7`
- Respuesta real: caudal en m³/s para 7 días (9,59 → 5,81), con celda en `40.425, -4.725` y resolución diaria. Basado en GloFAS.
- Idea: mostrar el caudal del río de la imagen del hero y su tendencia. Es una funcionalidad con identidad propia para esta localidad.
- Por verificar: que la celda corresponda al río que interesa (la foto muestra un puente sobre un río en Navaluenga) y qué significa un caudal "alto" para él; habría que definir umbrales propios.
- Caché sugerida: 6 horas, por ser un dato diario.

### 4.3 Geocoding con varios resultados (Verificado)

- Con `count>1` devuelve candidatos con `admin1`, `admin2` (provincia), `elevation`, `population`, `postcodes`, `timezone` y `country_code`. Ejemplo: junto a Navaluenga (Ávila, 764 m, 2.118 habitantes) aparece Navalengua (Albacete).
- Soluciona la limitación actual de usar siempre el primer resultado y es la base de un futuro selector visual de localidad (hoy fuera de alcance).
- Se puede mostrar la provincia y la altitud en el panel sin coste extra, porque el geocoding ya se resuelve al arrancar.

### 4.4 Histórico (Historical Weather API, ERA5) (Verificado)

- Endpoint: `https://archive-api.open-meteo.com/v1/archive?latitude=…&longitude=…&start_date=…&end_date=…&daily=temperature_2m_max,temperature_2m_min`
- Respuesta real para el 2025-11-23 en Navaluenga: máx 12,6 °C, mín 2,3 °C.
- Ideas: "hace un año" junto a la previsión de hoy, o comparar la temperatura actual con la media de los últimos años en la misma fecha.
- Coste: una fecha concreta es una llamada; un rango de varios años cuenta de forma fraccionada por días, así que debe pedirse como mucho una vez al día y guardarse en caché de larga duración.
- Por verificar: el retraso de disponibilidad de los datos más recientes respecto a hoy.

### 4.5 Ensemble (Verificado que responde)

- Endpoint: `https://ensemble-api.open-meteo.com/v1/ensemble?…&hourly=temperature_2m&models=ecmwf_ifs025`.
- Devuelve cada miembro por separado (`temperature_2m_member01`…), por lo que la respuesta es más pesada y los percentiles se calcularían en el backend.
- Idea: rango de incertidumbre ("entre 8 y 13 °") en los días más lejanos de la semana. Por verificar cómo cuenta cada miembro para el coste de llamadas.
- Prioridad baja para un panel de un vistazo.

### 4.6 Descartadas por ahora

| API | Motivo |
| --- | --- |
| Marine | Sin interés en una localidad de interior |
| Climate (CMIP6) y Seasonal | Escala de décadas y meses, sin encaje en un panel de lectura rápida |
| Satellite Radiation | Pensada para energía solar |
| Elevation | La previsión y el geocoding ya devuelven la elevación |

## 5. Mejoras de arquitectura asociadas

- **Aislar módulos secundarios** — Implementado: la calidad del aire tiene su propio servicio, caché y estado `stale` y se expone en `/api/air-quality`, con consulta independiente en el frontend (`useDashboardData`). Un fallo no invalida la previsión. Pendiente para el caudal del río o el histórico.
- **Proveedor multi-endpoint** — Implementado: `open-meteo.client.ts` concentra el acceso HTTP y cada API tiene su proveedor hermano; la localidad se resuelve una vez en `location.service.ts`; la caché es el helper genérico `shared/cached-resource.ts`.
- **Errores del proveedor**: Open-Meteo responde a una petición inválida con HTTP 400 y `{ "error": true, "reason": "…" }`. El cliente solo registra el código HTTP; incluir `reason` en el mensaje facilita diagnosticar un campo mal escrito.
- **Contrato compartido**: cada campo nuevo se duplica en backend y frontend (`weather.types.ts`, `types/weather.ts` y el validador manual). Con más módulos compensa extraer `packages/shared` (ya anotado en `limitaciones.md`).
- **Configuración por módulos**: activar o desactivar cada módulo adicional con variables de entorno, para que el dashboard mínimo siga funcionando sin ellos.

## 6. Ideas de interfaz

Todas respetan el criterio del proyecto: sin animaciones constantes y sin librerías pesadas.

- **Tema día/noche** — Implementado con la foto nocturna y `is_day` (no con `sunrise`/`sunset`, que seguiría pendiente): solo cambia la foto, los colores se mantienen.
- **Rosa de los vientos** compacta con `wind_direction_10m` — Implementado.
- **Gráfica horaria** de temperatura y lluvia en SVG propio (3.3) — Implementado.
- **Avisos discretos** como el badge de datos desactualizados: UV alto, rachas fuertes, calidad del aire mala. Pendiente (la calidad del aire ya se tinta según su nivel).
- **Rotación lenta de tarjetas secundarias** — Implementado: la card lateral y la franja inferior alternan sus vistas cada `UI_ROTATION_INTERVAL` con un fundido breve. El caudal del río podría sumarse como una vista más.

## 7. Priorización

| # | Idea | Valor | Esfuerzo | Llamadas extra | Dependencias | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sunrise/sunset y tema día/noche (3.1) | Medio | Bajo | Ninguna | Previsión semanal | Parcial (tema con `is_day`; sin orto y ocaso) |
| 2 | UV máximo, rachas y precipitación acumulada diarios (3.1) | Medio | Bajo | Ninguna | Previsión semanal | Pendiente |
| 3 | Dirección del viento, presión y racha actuales (3.2) | Medio | Bajo | Ninguna | — | Implementado |
| 4 | Gráfica horaria de temperatura y lluvia (3.3) | Alto | Medio | Ninguna | — | Implementado |
| 5 | Provincia y altitud desde el geocoding (4.3) | Bajo | Bajo | Ninguna | — | Pendiente |
| 6 | Calidad del aire y polen (4.1) | Medio | Medio | ~24-96/día | Proveedor multi-endpoint | Implementado |
| 7 | Caudal del río (4.2) | Medio (identidad local) | Medio | ~4-96/día | Proveedor multi-endpoint | Pendiente |
| 8 | "Hace un año" con histórico (4.4) | Bajo | Medio | Pocas | Proveedor multi-endpoint | Pendiente |
| 9 | Selector de localidad (4.3) | Medio | Alto | Pocas | Fuera de alcance del MVP | Pendiente |
| 10 | Rangos de incertidumbre con ensemble (4.5) | Bajo | Alto | Por verificar | — | Pendiente |

Siguientes candidatas: el caudal del río (7), que ya cuenta con el proveedor multi-endpoint y con la rotación para añadirlo como vista, y las variables diarias de la tabla 3.1 (2), que solo amplían el endpoint de previsión.
