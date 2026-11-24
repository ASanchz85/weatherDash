import styles from './TitleSlide.module.css';

interface TitleSlideProps {
  title: string;
}

/** Diapositiva sin cards con el título de lo que se mostrará a continuación. */
export function TitleSlide({ title }: TitleSlideProps) {
  return (
    <section className={styles.slide} aria-label="Siguiente vista">
      <h1 className={styles.title}>{title}</h1>
    </section>
  );
}
