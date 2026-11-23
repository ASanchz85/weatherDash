import { z } from 'zod';

/** Esquemas de validación de las respuestas externas de Open-Meteo. */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().min(1),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        country: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>;

export const forecastResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number().min(0).max(100),
    wind_speed_10m: z.number().min(0),
    weather_code: z.number().int().nonnegative(),
    is_day: z.union([z.literal(0), z.literal(1)]),
    precipitation_probability: z.number().min(0).max(100).nullable().optional(),
  }),
  daily: z
    .object({
      time: z.array(z.string().regex(ISO_DATE_PATTERN)).min(1),
      weather_code: z.array(z.number().int().nonnegative()),
      temperature_2m_max: z.array(z.number().nullable()),
      temperature_2m_min: z.array(z.number().nullable()),
      precipitation_probability_max: z.array(z.number().min(0).max(100).nullable()),
    })
    .refine(
      ({ time, ...series }) => Object.values(series).every((values) => values.length === time.length),
      { message: 'Las series diarias deben tener la misma longitud que time' },
    ),
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
