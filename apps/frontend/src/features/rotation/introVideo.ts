// La primera .mp4 de assets/video; sin ninguna, el ciclo usa la diapositiva «Tiempo».
export const INTRO_VIDEO_URL: string | null =
  Object.values(import.meta.glob<string>('../../../assets/video/*.mp4', { eager: true, query: '?url', import: 'default' }))[0] ??
  null;
