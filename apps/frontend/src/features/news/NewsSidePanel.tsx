import { SidePanel } from '../../components/SidePanel';
import { NEWS_FEED_LABELS, type NewsRotation } from '../../types/news';
import detailsStyles from '../weather/WeatherDetails.module.css';
import styles from './NewsSidePanel.module.css';

interface NewsSidePanelProps {
  rotation: NewsRotation;
  /** Noticia que se muestra en el hero; se resalta en la lista. */
  activeIndex: number;
}

/** Titulares de la rotación bajo el nombre del feed; la noticia activa se resalta en naranja. */
export function NewsSidePanel({ rotation, activeIndex }: NewsSidePanelProps) {
  return (
    <SidePanel label="Noticias">
      <article className={`${detailsStyles.details} ${styles.panel}`}>
        <header>
          <h2 className={detailsStyles.location}>{NEWS_FEED_LABELS[rotation.feed]}</h2>
          <p className={detailsStyles.country}>Europa Press</p>
        </header>
        <ol className={styles.headlines}>
          {rotation.items.map((item, index) => (
            <li
              key={item.id}
              className={index === activeIndex ? `${styles.headline} ${styles.active}` : styles.headline}
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <span className={styles.title}>{item.title}</span>
            </li>
          ))}
        </ol>
      </article>
    </SidePanel>
  );
}
