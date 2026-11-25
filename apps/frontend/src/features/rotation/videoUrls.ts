import type { VideoId } from './useDashboardCycle';

const files = import.meta.glob<string>('../../../assets/video/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
});

function videoUrl(name: string): string | null {
  return files[`../../../assets/video/${name}.mp4`] ?? null;
}

/** Vídeo de cada transición; sin archivo, el ciclo usa la diapositiva con título. */
export const VIDEO_URLS: Readonly<Record<VideoId, string | null>> = {
  weather: videoUrl('nav_vid'),
  national: videoUrl('news-national'),
  international: videoUrl('news-international'),
  economy: videoUrl('news-economy'),
  markets: videoUrl('news-stocks-and-markets'),
};

export const AVAILABLE_VIDEOS: readonly VideoId[] = (Object.keys(VIDEO_URLS) as VideoId[]).filter(
  (id) => VIDEO_URLS[id] !== null,
);
