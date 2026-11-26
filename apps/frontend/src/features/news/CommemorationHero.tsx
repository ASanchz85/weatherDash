import { HeroPanel } from '../../components/HeroPanel';
import type { NewsItem } from '../../types/news';
import styles from './NewsHero.module.css';

interface CommemorationHeroProps {
  item: NewsItem;
  /** Proveedor de la efeméride; firma el pie de foto. */
  source: string;
}

/** Foto de la efeméride con su fecha completa, en naranja, y el texto debajo como descripción. */
export function CommemorationHero({ item, source }: CommemorationHeroProps) {
  return (
    <HeroPanel label="Efeméride destacada" imageUrl={item.imageUrl} variant="news" caption={source}>
      <article className={styles.article}>
        <p className={styles.meta}>{item.category}</p>
        <p className={styles.description}>{item.description}</p>
      </article>
    </HeroPanel>
  );
}
