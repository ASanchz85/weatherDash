import { z } from 'zod';

import { fetchFeedText, NewsProviderError, type FeedRequestOptions } from '../news.http.js';
import type { NewsProvider } from '../news.provider.js';
import { localDate, startOfDay } from '../news.retention.js';
import { adaptCommemorations } from './commemorations.mapper.js';

// Wikimedia exige identificar al cliente en el User-Agent.
const USER_AGENT = 'WeatherDash/1.0 (panel meteorologico personal; efemerides del dia)';

export interface CommemorationsProviderOptions extends FeedRequestOptions {
  timeZone: string;
  now?: () => number;
}

const payloadSchema = z.object({ events: z.array(z.unknown()) });

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function createCommemorationsProvider({
  timeZone,
  now = Date.now,
  headers,
  ...request
}: CommemorationsProviderOptions): NewsProvider {
  return {
    async fetchFeed(urlTemplate) {
      const nowMs = now();
      const date = localDate(nowMs, timeZone);
      const url = urlTemplate.replace('{MM}', pad(date.month)).replace('{DD}', pad(date.day));
      const body = await fetchFeedText(url, {
        ...request,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...headers },
      });

      let document: unknown;
      try {
        document = JSON.parse(body);
      } catch (error) {
        throw new NewsProviderError('Las efemérides no son un JSON válido', { cause: error });
      }
      const payload = payloadSchema.safeParse(document);
      if (!payload.success) {
        throw new NewsProviderError('Las efemérides tienen un formato inesperado', { cause: payload.error });
      }

      return adaptCommemorations(payload.data.events, { date, publishedAt: startOfDay(nowMs, timeZone) });
    },
  };
}
