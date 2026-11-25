import { describe, expect, it } from 'vitest';

import { extractImageUrl } from './expansion.image.js';

const URL = 'https://e00-expansion.uecdn.es/assets/multimedia/imagenes/2026/10/27/a.jpg';

describe('extractImageUrl', () => {
  it('devuelve la URL de media:content sin modificarla', () => {
    expect(extractImageUrl([{ '@_url': URL, '@_medium': 'image', '@_width': '2048' }])).toBe(URL);
  });

  it('acepta un único elemento sin medium', () => {
    expect(extractImageUrl({ '@_url': URL })).toBe(URL);
  });

  it('salta los elementos que no son imagen y toma el primero válido', () => {
    expect(
      extractImageUrl([
        { '@_url': 'https://example.com/v.mp4', '@_medium': 'video' },
        { '@_url': URL, '@_medium': 'image' },
      ]),
    ).toBe(URL);
  });

  it('devuelve null sin imagen utilizable', () => {
    expect(extractImageUrl(undefined)).toBeNull();
    expect(extractImageUrl([{ '@_medium': 'image' }])).toBeNull();
    expect(extractImageUrl([{ '@_url': 'javascript:alert(1)' }])).toBeNull();
  });
});
