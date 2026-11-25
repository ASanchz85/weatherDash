import { DashboardLayout } from '../../components/DashboardLayout';
import { NEWS_FEED_SOURCES } from '../../types/news';
import { RotatingView } from '../rotation/RotatingView';
import type { ActiveNews } from '../rotation/useDashboardCycle';
import type { WeatherState } from '../dashboard/useDashboardData';
import { NewsHero } from './NewsHero';
import styles from './NewsDashboard.module.css';
import { NewsSidePanel } from './NewsSidePanel';
import { WeatherSummary } from './WeatherSummary';

interface NewsDashboardProps {
  news: ActiveNews;
  weather: WeatherState;
}

export function NewsDashboard({ news, weather }: NewsDashboardProps) {
  const { rotation, activeIndex } = news;
  const source = NEWS_FEED_SOURCES[rotation.feed];
  // Cada noticia es una vista: al cambiar de noticia la foto y el texto se funden juntos.
  const heroViews = rotation.items.map((item) => ({
    id: String(item.id),
    content: <NewsHero item={item} source={source} />,
  }));

  return (
    <DashboardLayout>
      <div className={styles.heroSlot}>
        <RotatingView views={heroViews} page={activeIndex} />
      </div>
      <NewsSidePanel rotation={rotation} activeIndex={activeIndex} />
      <WeatherSummary state={weather} />
    </DashboardLayout>
  );
}
