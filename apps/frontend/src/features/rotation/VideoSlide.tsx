import { useEffect, useRef } from 'react';

import { ROTATION_FADE_MS } from '../../config';
import styles from './VideoSlide.module.css';

interface VideoSlideProps {
  src: string;
  /** Se llama al terminar el vídeo, o si no puede reproducirse, para que el ciclo continúe. */
  onFinished: () => void;
}

/** Reproduce el vídeo completo, sin sonido ni controles, centrado y con el padding del dashboard. */
export function VideoSlide({ src, onFinished }: VideoSlideProps) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Empieza cuando el fundido de entrada ya terminó, para no perder el principio.
    const id = window.setTimeout(() => {
      Promise.resolve(video.current?.play()).catch(onFinished);
    }, ROTATION_FADE_MS);
    return () => window.clearTimeout(id);
  }, [onFinished]);

  return (
    <section className={styles.slide} aria-hidden="true">
      <video
        ref={video}
        className={styles.video}
        src={src}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        onEnded={onFinished}
        onError={onFinished}
      />
    </section>
  );
}
