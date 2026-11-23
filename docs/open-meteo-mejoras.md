# Ideas de mejora basadas en Open-Meteo

Documento de investigación para iterar sobre el dashboard. No describe trabajo comprometido: cada idea indica variables, endpoint, coste en llamadas y esfuerzo para poder priorizar. Las URLs de ejemplo usan Navaluenga (`latitude=40.41123`, `longitude=-4.70897`, `timezone=Europe/Madrid`).

Estado de verificación: **Verificado** significa que se consultó la API real para Navaluenga el 2026-11-23; **Por verificar** significa que solo se ha leído la documentación.

## 1. Qué usa la app hoy

| Endpoint | Variables | Uso |
| --- | --- | --- |
| `api.open-meteo.com/v1/forecast` | `current`: `temperature_2m`, `apparent_temperature`, `relative_humidity_2m`, `wind_speed_10m`, `weather_code`, `is_day`, `precipitation_probability`; `daily`: `temperature_2m_max`, `temperature_2m_min`; `forecast_days=1` | Panel meteorológico |
| `geocoding-api.open-meteo.com/v1/search` | `name`, `countryCode`, `language=es`, `count=1` | Resolver la localidad al arrancar |

La previsión semanal (iteración en curso) amplía `daily` con `weather_code` y `precipitation_probability_max`, y sube a `forecast_days=7`.

## 2. Límites y coste en llamadas

Plan gratuito, sin API key y solo para uso no comercial, suficiente para esta app personal:

| Límite | Valor |
| --- | --- |
| Por minuto / hora / día / mes | 600 / 5.000 / 10.000 / 300.000 llamadas |

No todas las peticiones cuentan como una llamada. Según la página de precios, una petición con más de 10 variables o con un rango de más de 2 semanas cuenta de forma fraccionada. Aproximación útil para planificar:

$$\text{coste} \approx \max\left(1, \frac{\text{variables}}{10}\right) \times \max\left(1, \frac{\text{días}}{14}\right)$$

- Hoy: 9 variables × 1 día → 1 llamada por consulta.
- Con la previsión semanal: 11 variables × 7 días → ~1,1 llamadas.
- Con la caché de 15 minutos son 96 consultas al día por endpoint. Cada endpoint nuevo consultado con ese ritmo suma ~96 llamadas/día; con TTL mayores, menos. Aun sumando varios, el uso queda muy por debajo de las 10.000 diarias.
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

### 3.2 Variables actuales adicionales (`current=`)

Verificado: `pressure_msl` (1024,9 hPa), `wind_direction_10m` (90°), `cloud_cover` (96 %) y `wind_gusts_10m` (6,1 km/h).

- Dirección del viento con rosa/flecha junto a la velocidad actual.
- Presión y tendencia (comparando con la hora anterior en datos horarios).
- Racha máxima junto al viento medio.

### 3.3 Datos horarios (`hourly=`)

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

### 4.1 Calidad del aire y polen (Verificado)

- Endpoint: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=…&longitude=…&current=european_aqi,pm2_5,dust,olive_pollen,grass_pollen,uv_index`
- Respuesta real para Navaluenga: `european_aqi` 22 (aceptable; la escala va de 0-20 bueno a más de 100 extremadamente malo), `pm2_5` 2,6 µg/m³, `dust` 0,0, polen de olivo y gramíneas 0,0 granos/m³, `uv_index` 2,45. El intervalo de `current` es de 3.600 s.
- Variables disponibles: `european_aqi` (y por contaminante), `us_aqi`, `pm10`, `pm2_5`, `ozone`, `nitrogen_dioxide`, `dust` (polvo del Sáhara, relevante en España), `uv_index`, `aerosol_optical_depth`, y pólenes de aliso, abedul, gramíneas, artemisa, olivo y ambrosía (solo Europa y en temporada).
- Datos: CAMS europeo a ~11 km, actualizado cada 24 h; el global, cada 12 h.
- Caché sugerida: 1 a 3 horas. Coste: una consulta más por ciclo, bien por debajo del límite.
- Idea: tarjeta o indicador discreto con el índice de calidad del aire y, solo en temporada, el polen de olivo y gramíneas.
- Por verificar: valores `null` de polen fuera de temporada y cómo mostrarlos.

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

- **Aislar módulos secundarios**: la calidad del aire, el caudal o el histórico no deben invalidar la previsión principal. Cada uno puede tener su propio servicio, TTL y estado `stale`, siguiendo el patrón de `weather.service.ts`. Podrían exponerse como endpoints independientes (por ejemplo `/api/air-quality`) y que el frontend los consulte con hooks propios, como `useWeather`.
- **Proveedor multi-endpoint**: hoy `weather.provider.ts` conoce una sola URL de previsión; añadir hosts nuevos exige ampliar el contrato `WeatherProvider` o crear proveedores hermanos, manteniendo que solo ellos conocen Open-Meteo.
- **Errores del proveedor**: Open-Meteo responde a una petición inválida con HTTP 400 y `{ "error": true, "reason": "…" }`. El proveedor actual solo registra el código HTTP; incluir `reason` en el mensaje facilita diagnosticar un campo mal escrito.
- **Contrato compartido**: cada campo nuevo se duplica en backend y frontend (`weather.types.ts`, `types/weather.ts` y el validador manual). Con más módulos compensa extraer `packages/shared` (ya anotado en `limitaciones.md`).
- **Configuración por módulos**: activar o desactivar cada módulo adicional con variables de entorno, para que el dashboard mínimo siga funcionando sin ellos.

## 6. Ideas de interfaz

Todas respetan el criterio del proyecto: sin animaciones constantes y sin librerías pesadas.

- **Tema día/noche** con `sunrise`/`sunset` reales: oscurecer algo más la superficie de noche.
- **Rosa de los vientos** compacta con `wind_direction_10m`.
- **Gráfica horaria** de temperatura y lluvia en SVG propio (3.3).
- **Avisos discretos** como el badge de datos desactualizados: UV alto, rachas fuertes, calidad del aire mala.
- **Rotación lenta de tarjetas secundarias** (por ejemplo, calidad del aire y caudal alternando en una misma zona cada varios minutos) para no saturar la pantalla; evitar transiciones animadas.

## 7. Priorización

| # | Idea | Valor | Esfuerzo | Llamadas extra | Dependencias |
| --- | --- | --- | --- | --- | --- |
| 1 | Sunrise/sunset y tema día/noche (3.1) | Medio | Bajo | Ninguna | Previsión semanal |
| 2 | UV máximo, rachas y precipitación acumulada diarios (3.1) | Medio | Bajo | Ninguna | Previsión semanal |
| 3 | Dirección del viento, presión y racha actuales (3.2) | Medio | Bajo | Ninguna | — |
| 4 | Gráfica horaria de temperatura y lluvia (3.3) | Alto | Medio | Ninguna | — |
| 5 | Provincia y altitud desde el geocoding (4.3) | Bajo | Bajo | Ninguna | — |
| 6 | Calidad del aire y polen (4.1) | Medio | Medio | ~24-96/día | Proveedor multi-endpoint |
| 7 | Caudal del río (4.2) | Medio (identidad local) | Medio | ~4-96/día | Proveedor multi-endpoint |
| 8 | "Hace un año" con histórico (4.4) | Bajo | Medio | Pocas | Proveedor multi-endpoint |
| 9 | Selector de localidad (4.3) | Medio | Alto | Pocas | Fuera de alcance del MVP |
| 10 | Rangos de incertidumbre con ensemble (4.5) | Bajo | Alto | Por verificar | — |

Orden recomendado: 1-3 en la misma iteración (solo tocan el endpoint de previsión), después 4 y finalmente los módulos con endpoint propio (6 y 7), tras aislar el proveedor como se describe en la sección 5.
