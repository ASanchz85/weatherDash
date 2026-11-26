import { describe, expect, it } from 'vitest';

import { adaptCommemorations, MAX_COMMEMORATIONS } from './commemorations.mapper.js';

const CONTEXT = { date: { year: 2026, month: 11, day: 26 }, publishedAt: Date.UTC(2026, 10, 25, 23) };
const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons';

function photoPage(name: string, pageUrl = `https://es.wikipedia.org/wiki/${name}`) {
  return {
    type: 'standard',
    title: name,
    content_urls: { desktop: { page: pageUrl } },
    originalimage: { source: `${COMMONS}/a/ab/${name}.jpg`, width: 900, height: 700 },
  };
}

function event(year: number, text: string, pages: unknown[] = [photoPage(`Foto_${year}`)]) {
  return { year, text, pages };
}

describe('adaptCommemorations', () => {
  it('convierte un evento en una noticia con la fecha completa como categoría', () => {
    const [item] = adaptCommemorations(
      [event(2003, 'el avión Concorde realiza el último de sus vuelos', [photoPage('Concorde')])],
      CONTEXT,
    );

    expect(item).toEqual({
      title: 'El avión Concorde realiza el último de sus vuelos.',
      description: 'El avión Concorde realiza el último de sus vuelos.',
      link: 'https://es.wikipedia.org/wiki/Concorde#2003-0',
      guid: 'https://es.wikipedia.org/wiki/Concorde#2003-0',
      enclosureUrl: `${COMMONS}/a/ab/Concorde.jpg`,
      publishedAt: CONTEXT.publishedAt,
      category: '26 de noviembre de 2003',
    });
  });

  it('descarta los eventos sin foto válida', () => {
    const flag = { originalimage: { source: `${COMMONS}/3/36/Flag_of_Albania.svg`, width: 900, height: 600 } };

    expect(adaptCommemorations([event(1999, 'sucede un terremoto en la zona', [flag]), event(1998, 'otro suceso sin páginas', [])], CONTEXT)).toEqual([]);
  });

  it('descarta las introducciones que acaban en dos puntos y los textos repetidos', () => {
    const items = adaptCommemorations(
      [
        event(2020, 'acontecimientos en torno al fallecimiento de Diego Maradona, fallecido el día anterior:'),
        event(2019, 'aterriza en Marte la misión InSight de la NASA'),
        event(2018, 'Aterriza en Marte la misión InSight de la NASA.'),
      ],
      CONTEXT,
    );

    expect(items.map((item) => item.category)).toEqual(['26 de noviembre de 2019']);
  });

  it('limpia el marcado y los espacios del texto', () => {
    const [item] = adaptCommemorations([event(1985, '  México lanza el <b>Morelos&nbsp;II</b>,   un satélite  ')], CONTEXT);

    expect(item?.title).toBe('México lanza el Morelos II, un satélite.');
  });

  it('inserta de más antiguo a más reciente para que la rotación empiece por los recientes', () => {
    const items = adaptCommemorations(
      [event(1970, 'ocurre algo muy antiguo'), event(2011, 'ocurre algo bastante reciente'), event(1991, 'ocurre algo intermedio')],
      CONTEXT,
    );

    expect(items.map((item) => item.category.slice(-4))).toEqual(['1970', '1991', '2011']);
  });

  it('no repite el enlace cuando dos eventos del mismo año comparten página', () => {
    const shared = 'https://es.wikipedia.org/wiki/Jackson';
    const items = adaptCommemorations(
      [
        event(1991, 'publica un álbum de estudio', [photoPage('Foto_A', shared)]),
        event(1991, 'lanza su primer disco', [photoPage('Foto_B', shared)]),
      ],
      CONTEXT,
    );

    expect(new Set(items.map((item) => item.link)).size).toBe(2);
  });

  it('limita el número de efemérides por día', () => {
    const events = Array.from({ length: MAX_COMMEMORATIONS + 5 }, (_, index) =>
      event(2000 - index, `sucede el acontecimiento número ${index}`),
    );

    expect(adaptCommemorations(events, CONTEXT)).toHaveLength(MAX_COMMEMORATIONS);
  });

  it('no repite la misma foto en varias efemérides', () => {
    const generic = photoPage('Terremoto');
    const items = adaptCommemorations(
      [event(2019, 'sucede un terremoto en Albania', [generic]), event(2004, 'sucede un sismo en Papúa', [generic, photoPage('Papua')])],
      CONTEXT,
    );

    expect(new Set(items.map((item) => item.enclosureUrl)).size).toBe(items.length);
    expect(items).toHaveLength(2);
  });

  it('ignora los eventos con un formato inesperado', () => {
    expect(adaptCommemorations([null, { text: 3 }, { year: 2000 }], CONTEXT)).toEqual([]);
  });
});
