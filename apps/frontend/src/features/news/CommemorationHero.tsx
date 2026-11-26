import type { CSSProperties } from 'react';

import { HeroPanel } from '../../components/HeroPanel';
import type { NewsItem } from '../../types/news';
import styles from './CommemorationHero.module.css';
import { splitCommemorationDate } from './newsFormat';

interface CommemorationHeroProps {
  item: NewsItem;
  /** Proveedor de la efeméride; firma el pie de foto. */
  source: string;
}

/** Fecha (día y mes en blanco, año grande en naranja) y, debajo, el texto de la efeméride sobre su foto. */
export function CommemorationHero({ item, source }: CommemorationHeroProps) {
  const date = splitCommemorationDate(item.category);
  // La fuente es monoespaciada: con el cuerpo proporcional al número de caracteres, ambas líneas miden lo mismo.
  const yearStyle = date ? ({ '--year-scale': date.dayMonth.length / date.year.length } as CSSProperties) : undefined;

  return (
    <HeroPanel label="Efeméride destacada" imageUrl={item.imageUrl} variant="news" caption={source}>
      <article className={styles.article}>
        {date ? (
          <p className={styles.date} style={yearStyle}>
            <span className={styles.dayMonth}>{date.dayMonth}</span>
            <span className={styles.year}>{date.year}</span>
          </p>
        ) : (
          <p className={styles.dayMonth}>{item.category}</p>
        )}
        <p className={styles.description}>{item.description}</p>
      </article>
    </HeroPanel>
  );
}
