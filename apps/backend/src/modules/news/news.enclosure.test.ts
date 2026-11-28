import { describe, expect, it } from 'vitest';

import { extractEnclosureImageUrl } from './news.enclosure.js';

describe('extractEnclosureImageUrl', () => {
  it('devuelve la primera imagen e ignora los enclosure de vídeo o audio', () => {
    expect(
      extractEnclosureImageUrl([
        { '@_url': 'https://x.es/a.mp4', '@_type': 'video/mp4' },
        { '@_url': 'https://x.es/b.mp3', '@_type': 'audio/mpeg' },
        { '@_url': 'https://x.es/c.jpg', '@_type': 'image/jpg' },
        { '@_url': 'https://x.es/d.jpg', '@_type': 'image/jpeg' },
      ]),
    ).toBe('https://x.es/c.jpg');
  });

  it('acepta un único enclosure sin lista y compara el tipo sin distinguir mayúsculas', () => {
    expect(extractEnclosureImageUrl({ '@_url': 'https://x.es/a.png', '@_type': 'IMAGE/PNG' })).toBe('https://x.es/a.png');
  });

  it('sin type decide por la extensión de la ruta, ignorando la query', () => {
    expect(extractEnclosureImageUrl([{ '@_url': 'https://x.es/a.webp?w=800' }])).toBe('https://x.es/a.webp?w=800');
    expect(extractEnclosureImageUrl([{ '@_url': 'https://x.es/a.mp4' }])).toBeNull();
  });

  it('devuelve null sin imagen utilizable', () => {
    expect(extractEnclosureImageUrl(undefined)).toBeNull();
    expect(extractEnclosureImageUrl([])).toBeNull();
    expect(extractEnclosureImageUrl([{ '@_url': 'ftp://x.es/a.jpg', '@_type': 'image/jpeg' }])).toBeNull();
    expect(extractEnclosureImageUrl(['no es un objeto', null])).toBeNull();
  });
});
