import type { WeatherConfig } from '../config/env.js';
import type { AirQualityResponse } from '../modules/air-quality/air-quality.schema.js';
import type { AirQualitySnapshot } from '../modules/air-quality/air-quality.types.js';
import type { ResolvedLocation } from '../modules/location/location.types.js';
import type { ParsedNewsItem } from '../modules/news/news.types.js';
import type { ForecastResponse } from '../modules/weather/weather.schema.js';
import type {
  DailyForecast,
  HourlyForecast,
  WeatherSnapshot,
} from '../modules/weather/weather.types.js';

export const weatherConfig: WeatherConfig = {
  locationName: 'Navaluenga',
  fallbackLocationName: 'Ávila',
  country: 'España',
  countryCode: 'ES',
  coordinates: null,
  timezone: 'Europe/Madrid',
  refreshIntervalMs: 15 * 60 * 1000,
  requestTimeoutMs: 1000,
};

export const navaluenga: ResolvedLocation = {
  name: 'Navaluenga',
  country: 'España',
  latitude: 40.41123,
  longitude: -4.70897,
  timezone: 'Europe/Madrid',
};

export const forecastResponse: ForecastResponse = {
  current: {
    temperature_2m: 8.4,
    apparent_temperature: 6.1,
    relative_humidity_2m: 72,
    wind_speed_10m: 2.3,
    wind_direction_10m: 90,
    wind_gusts_10m: 6.1,
    pressure_msl: 1024.9,
    cloud_cover: 96,
    weather_code: 2,
    is_day: 1,
    precipitation_probability: 10,
  },
  daily: {
    time: ['2026-11-23', '2026-11-24', '2026-11-25'],
    weather_code: [2, 61, 3],
    temperature_2m_max: [11.9, 10.4, 9.6],
    temperature_2m_min: [0.8, 2.6, 4.6],
    precipitation_probability_max: [0, 65, 25],
    sunrise: ['2026-11-23T08:11', '2026-11-24T08:12', '2026-11-25T08:13'],
    sunset: ['2026-11-23T17:49', '2026-11-24T17:48', '2026-11-25T17:47'],
  },
  hourly: {
    time: ['2026-11-23T18:00', '2026-11-23T19:00', '2026-11-23T20:00'],
    temperature_2m: [9.2, 7.6, 6.3],
    precipitation_probability: [0, 0, 20],
    weather_code: [1, 3, 61],
    is_day: [1, 0, 0],
  },
};

export const airQualityResponse: AirQualityResponse = {
  current: {
    european_aqi: 22,
    pm2_5: 3.3,
    dust: 0,
    uv_index: 0,
    olive_pollen: 0,
    grass_pollen: 0,
  },
};

export function buildAirQuality(): AirQualitySnapshot {
  return {
    europeanAqi: 22,
    pm25: 3.3,
    dust: 0,
    uvIndex: 0,
    pollen: { olive: 0, grass: 0 },
  };
}

export const geocodingResponse = {
  results: [
    {
      name: 'Navaluenga',
      latitude: 40.41123,
      longitude: -4.70897,
      country: 'España',
      timezone: 'Europe/Madrid',
    },
  ],
};

export function buildSnapshot(temperature = 8.4): WeatherSnapshot {
  return {
    location: { name: 'Navaluenga', country: 'España' },
    current: {
      temperature,
      apparentTemperature: 6.1,
      relativeHumidity: 72,
      windSpeed: 2.3,
      windDirection: 90,
      windGusts: 6.1,
      pressure: 1024.9,
      cloudCover: 96,
      precipitationProbability: 10,
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      isDay: true,
    },
    daily: {
      temperatureMax: 11.9,
      temperatureMin: 0.8,
      sunrise: '2026-11-23T08:11',
      sunset: '2026-11-23T17:49',
    },
    forecast: buildForecast(),
    hourly: buildHourly(),
  };
}

export function buildHourly(): HourlyForecast[] {
  return [
    {
      time: '2026-11-23T18:00',
      temperature: 9.2,
      precipitationProbability: 0,
      weatherCode: 1,
      icon: 'mostly-clear',
      isDay: true,
    },
    {
      time: '2026-11-23T19:00',
      temperature: 7.6,
      precipitationProbability: 0,
      weatherCode: 3,
      icon: 'cloudy',
      isDay: false,
    },
    {
      time: '2026-11-23T20:00',
      temperature: 6.3,
      precipitationProbability: 20,
      weatherCode: 61,
      icon: 'rain',
      isDay: false,
    },
  ];
}

export function buildForecast(): DailyForecast[] {
  return [
    {
      date: '2026-11-23',
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      temperatureMax: 11.9,
      temperatureMin: 0.8,
      precipitationProbabilityMax: 0,
    },
    {
      date: '2026-11-24',
      weatherCode: 61,
      description: 'Lluvia ligera',
      icon: 'rain',
      temperatureMax: 10.4,
      temperatureMin: 2.6,
      precipitationProbabilityMax: 65,
    },
    {
      date: '2026-11-25',
      weatherCode: 3,
      description: 'Cubierto',
      icon: 'cloudy',
      temperatureMax: 9.6,
      temperatureMin: 4.6,
      precipitationProbabilityMax: 25,
    },
  ];
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function buildNewsItem(slug: string, overrides: Partial<ParsedNewsItem> = {}): ParsedNewsItem {
  const link = `https://www.europapress.es/internacional/noticia-${slug}.html`;
  return {
    title: `Titular ${slug}`,
    link,
    description: `Descripción ${slug}`,
    enclosureUrl: `https://img.europapress.es/fotoweb/fotonoticia_${slug}_120.jpg`,
    guid: link,
    publishedAt: Date.UTC(2026, 10, 24, 8),
    category: 'Internacional',
    ...overrides,
  };
}

export const NEWS_FEED_XML = `<?xml version="1.0" encoding="utf-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title>Europa Press - Internacional</title>
<item>
<title>Diez años del acuerdo de paz en Colombia</title>
<link>https://www.europapress.es/internacional/noticia-colombia-20261124083249.html</link>
<description> La última década ha estado marcada por "la incapacidad" &amp; la violencia</description>
<enclosure url="https://img.europapress.es/fotoweb/fotonoticia_20261124083249_120.jpg" length="4096" type="image/jpeg"/>
<guid isPermaLink="true">https://www.europapress.es/internacional/noticia-colombia-20261124083249.html</guid>
<pubDate>Tue, 24 Nov 2026 07:32:49 GMT</pubDate>
<category>Internacional</category>
</item>
<item>
<title>Noticia sin imagen</title>
<link>https://www.europapress.es/internacional/noticia-sin-imagen.html</link>
<description>No trae enclosure</description>
<pubDate>Tue, 24 Nov 2026 07:00:00 GMT</pubDate>
<category>Internacional</category>
</item>
<item>
<title>Noticia con fecha rota</title>
<link>https://www.europapress.es/internacional/noticia-fecha-rota.html</link>
<description>Fecha inválida</description>
<enclosure url="https://img.europapress.es/fotoweb/fotonoticia_1_120.jpg" length="4096" type="image/jpeg"/>
<pubDate>no es una fecha</pubDate>
<category>Internacional</category>
</item>
</channel>
</rss>`;

export const EXPANSION_FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
<channel>
<title><![CDATA[ Mercados ]]></title>
<item>
<title>
<![CDATA[ Solaria y Merlin aceleran en el Ibex con el nuevo decreto de centros de datos ]]>
</title>
<description>
<![CDATA[ Texto largo con enlaces.&nbsp;<a href="https://www.expansion.com/mercados/2026/10/27/6ae0794b468aeb796d8b459e.html">Leer</a><img src="http://secure-uk.imrworldwide.com/cgi-bin/m?cid=x" alt=""/> ]]>
</description>
<dc:creator>
<![CDATA[ Alejandro Sánchez ]]>
</dc:creator>
<link>https://www.expansion.com/mercados/2026/10/27/6ae0794b468aeb796d8b459e.html</link>
<category>
<![CDATA[ Mercados ]]>
</category>
<category>
<![CDATA[ Inversión ]]>
</category>
<category>
<![CDATA[ Artículos Alejandro Sánchez ]]>
</category>
<media:description type="html">
<![CDATA[ La reformulación del decreto resulta aún "insuficiente", a juicio de los analistas.&nbsp; Solaria y Merlin despuntan en el <b>Ibex</b>. ]]>
</media:description>
<media:title type="html">
<![CDATA[ MERCADOS ]]>
</media:title>
<media:content url="https://e00-expansion.uecdn.es/assets/multimedia/imagenes/2026/10/27/17930959876861.jpg" medium="image" width="2048" height="1365"/>
<media:thumbnail url="https://e00-expansion.uecdn.es/assets/multimedia/imagenes/2026/10/27/17930959876861_150x0.jpg" width="150" height="99"/>
<guid>https://www.expansion.com/mercados/2026/10/27/6ae0794b468aeb796d8b459e.html</guid>
<pubDate>Tue, 27 Oct 2026 13:26:41 +0100</pubDate>
</item>
<item>
<title><![CDATA[ Noticia sin imagen ]]></title>
<link>https://www.expansion.com/mercados/2026/10/27/sin-imagen.html</link>
<media:description type="html"><![CDATA[ No trae media:content ]]></media:description>
<pubDate>Tue, 27 Oct 2026 12:00:00 +0100</pubDate>
</item>
<item>
<title><![CDATA[ Noticia con fecha rota ]]></title>
<link>https://www.expansion.com/mercados/2026/10/27/fecha-rota.html</link>
<media:content url="https://e00-expansion.uecdn.es/assets/multimedia/imagenes/a.jpg" medium="image"/>
<pubDate>no es una fecha</pubDate>
</item>
<item>
<title><![CDATA[ Solaria y Merlin aceleran en el Ibex (repetida) ]]></title>
<link>https://www.expansion.com/mercados/2026/10/27/6ae0794b468aeb796d8b459e.html?utm_source=rss#comentarios</link>
<media:content url="https://e00-expansion.uecdn.es/assets/multimedia/imagenes/a.jpg" medium="image"/>
<pubDate>Tue, 27 Oct 2026 13:30:00 +0100</pubDate>
</item>
</channel>
</rss>`;
