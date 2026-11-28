import { NEWS_FEED_IDS, NEWS_FEEDS, type NewsFeedId } from '../../types/news';
import type { VideoId } from './useDashboardCycle';

const files = import.meta.glob<string>('../../../assets/video/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
});

function videoUrl(name: string): string | null {
  return files[`../../../assets/video/${name}.mp4`] ?? null;
}

const NEWS_VIDEO_URLS = Object.fromEntries(
  NEWS_FEED_IDS.map((feed) => [feed, videoUrl(NEWS_FEEDS[feed].video)]),
) as Record<NewsFeedId, string | null>;

/** Vídeo de cada transición; sin archivo, el ciclo usa la diapositiva con título. */
export const VIDEO_URLS: Readonly<Record<VideoId, string | null>> = {
  weather: videoUrl('nav_vid'),
  ...NEWS_VIDEO_URLS,
};

export const AVAILABLE_VIDEOS: readonly VideoId[] = (Object.keys(VIDEO_URLS) as VideoId[]).filter(
  (id) => VIDEO_URLS[id] !== null,
);
