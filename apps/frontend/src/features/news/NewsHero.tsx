import { HeroPanel } from '../../components/HeroPanel';
import type { NewsItem } from '../../types/news';
import styles from './NewsHero.module.css';
import { formatPublishedAt } from './newsFormat';

interface NewsHeroProps {
  item: NewsItem;
}

/** Foto de la noticia con su titular, metadata (fecha y categoría de Europa Press) y descripción encima. */
export function NewsHero({ item }: NewsHeroProps) {
  return (
    <HeroPanel label="Noticia destacada" imageUrl={item.imageUrl} variant="news" caption="Europa Press">
      <article className={styles.article}>
        <h2 className={styles.title}>{item.title}</h2>
        <p className={styles.meta}>
          <time dateTime={item.publishedAt}>{formatPublishedAt(item.publishedAt)}</time>
          {item.category && (
            <>
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              <span>{item.category}</span>
            </>
          )}
        </p>
        {item.description && <p className={styles.description}>{item.description}</p>}
      </article>
    </HeroPanel>
  );
}
