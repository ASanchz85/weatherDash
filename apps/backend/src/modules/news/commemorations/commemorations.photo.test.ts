import { describe, expect, it } from 'vitest';

import { pickPhoto, type WikipediaPage } from './commemorations.photo.js';

function page(source: string, width: number, height: number, extra: Partial<WikipediaPage> = {}): WikipediaPage {
  return { originalimage: { source, width, height }, ...extra };
}

const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons';

describe('pickPhoto', () => {
  it('descarta banderas, logos, SVG y mapas y se queda con la primera fotografía', () => {
    const photo = pickPhoto([
      page('https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Flag_of_Albania.svg/langes-960px-Flag_of_Albania.svg.png', 900, 600),
      page(`${COMMONS}/e/e5/NASA_logo.png`, 1200, 1000),
      page(`${COMMONS}/a/a3/China_USA_Locator.png`, 1357, 628),
      page(`${COMMONS}/d/d2/Haiti_earthquake_damage.jpg?utm_source=es.wikipedia.org`, 800, 600),
    ]);

    expect(photo?.url).toBe(`${COMMONS}/d/d2/Haiti_earthquake_damage.jpg`);
  });

  it('descarta las imágenes demasiado pequeñas', () => {
    expect(pickPhoto([page(`${COMMONS}/a/ab/Pequena.jpg`, 320, 240)])).toBeNull();
  });

  it('prefiere una foto apaisada a una vertical', () => {
    const photo = pickPhoto([page(`${COMMONS}/5/5b/Retrato.jpg`, 566, 1006), page(`${COMMONS}/8/87/Paisaje.jpg`, 1200, 800)]);

    expect(photo?.url).toContain('Paisaje.jpg');
  });

  it('acepta una vertical si no hay otra', () => {
    expect(pickPhoto([page(`${COMMONS}/5/5b/Retrato.jpg`, 566, 1006)])?.url).toBe(`${COMMONS}/5/5b/Retrato.jpg`);
  });

  it('ignora las páginas de desambiguación', () => {
    expect(pickPhoto([page(`${COMMONS}/8/87/Paisaje.jpg`, 1200, 800, { type: 'disambiguation' })])).toBeNull();
  });

  it('pide una miniatura de 960 px cuando el original es mayor', () => {
    expect(pickPhoto([page(`${COMMONS}/9/9a/Nationaltheatret_evening.jpg`, 4000, 2500)])?.url).toBe(
      `${COMMONS}/thumb/9/9a/Nationaltheatret_evening.jpg/960px-Nationaltheatret_evening.jpg`,
    );
  });

  it('reduce también las miniaturas grandes de thumb.wikimedia.org', () => {
    const source =
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Casa_Rosada.JPG/3840px-Casa_Rosada.JPG?utm_source=es.wikipedia.org';

    expect(pickPhoto([page(source, 5184, 3456)])?.url).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Casa_Rosada.JPG/960px-Casa_Rosada.JPG',
    );
  });

  it('devuelve la página de origen de la foto', () => {
    const photo = pickPhoto([
      page(`${COMMONS}/8/87/Paisaje.jpg`, 1200, 800, {
        content_urls: { desktop: { page: 'https://es.wikipedia.org/wiki/Paisaje' } },
      }),
    ]);

    expect(photo?.pageUrl).toBe('https://es.wikipedia.org/wiki/Paisaje');
  });
});
