import { config as loadDotenv } from 'dotenv';

import { buildApp, NEWS_DEFAULT_TIME_ZONE } from './app.js';
import { loadConfig } from './config/env.js';
import { ROOT_ENV_PATH } from './config/paths.js';
import { openDatabase } from './database/database.js';
import { createSqliteSnapshotStorage } from './database/sqlite-snapshot-storage.js';
import { createOpenMeteoAirQualityProvider } from './modules/air-quality/air-quality.provider.js';
import { createCommemorationsProvider } from './modules/news/commemorations/commemorations.provider.js';
import { createEuropaPressProvider } from './modules/news/europa-press/europa-press.provider.js';
import { createExpansionProvider } from './modules/news/expansion/expansion.provider.js';
import { mapFeeds, NEWS_FEED_DEFINITIONS, type NewsSource } from './modules/news/news.feeds.js';
import { createNewsRepository } from './modules/news/news.repository.js';
import type { NewsProvider } from './modules/news/news.types.js';
import { createOpenMeteoProvider } from './modules/weather/weather.provider.js';

loadDotenv({ path: ROOT_ENV_PATH, quiet: true });

const config = loadConfig();
const { requestTimeoutMs } = config.weather;
const database = openDatabase(config.databasePath);
const providersBySource: Record<NewsSource, NewsProvider> = {
  'europa-press': createEuropaPressProvider({ requestTimeoutMs: config.news.requestTimeoutMs }),
  expansion: createExpansionProvider({ requestTimeoutMs: config.news.requestTimeoutMs }),
  commemorations: createCommemorationsProvider({
    requestTimeoutMs: config.news.requestTimeoutMs,
    timeZone: config.weather.timezone ?? NEWS_DEFAULT_TIME_ZONE,
  }),
};

const app = await buildApp({
  weatherConfig: config.weather,
  uiConfig: config.ui,
  weatherProvider: createOpenMeteoProvider({ requestTimeoutMs }),
  airQualityProvider: createOpenMeteoAirQualityProvider({ requestTimeoutMs }),
  news: {
    config: config.news,
    providers: mapFeeds((feed) => providersBySource[NEWS_FEED_DEFINITIONS[feed].source]),
    repository: createNewsRepository(database),
    autoRefresh: true,
  },
  snapshotStorage: createSqliteSnapshotStorage(database),
  staticDir: config.staticDir,
  prefetchWeather: true,
  logger: { level: config.nodeEnv === 'production' ? 'info' : 'debug' },
});
app.addHook('onClose', async () => {
  database.close();
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Cerrando servidor');
  await app.close();
  process.exit(0);
}

process.once('SIGINT', (signal) => void shutdown(signal));
process.once('SIGTERM', (signal) => void shutdown(signal));

await app.listen({ host: config.host, port: config.port });
