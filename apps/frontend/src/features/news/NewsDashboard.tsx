import { DashboardLayout } from '../../components/DashboardLayout';
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
  // Cada noticia es una vista: al cambiar de noticia la foto y el texto se funden juntos.
  const heroViews = rotation.items.map((item) => ({ id: String(item.id), content: <NewsHero item={item} /> }));

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
