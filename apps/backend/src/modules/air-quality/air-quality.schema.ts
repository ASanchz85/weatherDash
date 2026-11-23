import { z } from 'zod';

/** Todas las medidas son opcionales y admiten null: fuera de Europa el polen llega como null. */
const measure = z.number().min(0).nullable().optional();

export const airQualityResponseSchema = z.object({
  current: z.object({
    european_aqi: measure,
    pm2_5: measure,
    dust: measure,
    uv_index: measure,
    olive_pollen: measure,
    grass_pollen: measure,
  }),
});

export type AirQualityResponse = z.infer<typeof airQualityResponseSchema>;
