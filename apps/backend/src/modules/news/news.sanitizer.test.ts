import { describe, expect, it } from 'vitest';

import { cleanCategory, cleanText, parsePublishedAt, trimToLastSentence } from './news.sanitizer.js';

describe('cleanText', () => {
  it('elimina los restos de CDATA y recorta', () => {
    expect(cleanText('<![CDATA[ Titular ]]>')).toBe('Titular');
    expect(cleanText('&lt;![CDATA[ Titular ]]&gt;')).toBe('Titular');
  });

  it('elimina el marcado HTML y decodifica entidades', () => {
    expect(cleanText('Sube el <b>Ibex</b>&nbsp;un 1&#44;5&#x25; &amp; &quot;cierra&quot;')).toBe(
      'Sube el Ibex un 1,5% & "cierra"',
    );
    expect(cleanText('Texto<a href="https://x.es">Leer</a><img src="x" alt=""/>')).toBe('Texto Leer');
  });

  it('deja intactos los símbolos de menor o mayor que no forman una etiqueta', () => {
    expect(cleanText('El PIB < 2 y > 1')).toBe('El PIB < 2 y > 1');
  });

  it('colapsa espacios y elimina caracteres invisibles', () => {
    expect(cleanText('  Uno \n\t dos\u200B tres\uFEFF  ')).toBe('Uno dos tres');
  });

  it('no altera las entidades desconocidas ni los códigos inválidos', () => {
    expect(cleanText('a &inventada; b &#99999999; c')).toBe('a &inventada; b &#99999999; c');
  });
});

describe('cleanCategory', () => {
  it('devuelve la primera categoría con contenido', () => {
    expect(cleanCategory(['<![CDATA[  ]]>', ' <![CDATA[ Mercados ]]> ', 'Inversión'])).toBe('Mercados');
    expect(cleanCategory([])).toBe('');
  });
});

describe('parsePublishedAt', () => {
  it('convierte la fecha RFC 822 con su desfase', () => {
    expect(parsePublishedAt(' Tue, 27 Oct 2026 13:26:41 +0100 ')).toBe(Date.UTC(2026, 9, 27, 12, 26, 41));
  });

  it('devuelve null si no es una fecha', () => {
    expect(parsePublishedAt('no es una fecha')).toBeNull();
  });
});

describe('trimToLastSentence', () => {
  it('quita la frase cortada y los puntos suspensivos finales', () => {
    expect(trimToLastSentence('Primera frase. Segunda frase completa. Tercera que se corta en el ...')).toBe(
      'Primera frase. Segunda frase completa.',
    );
    expect(trimToLastSentence('Una frase. Otra que se corta…')).toBe('Una frase.');
  });

  it('no toca un texto que ya termina en una frase completa', () => {
    expect(trimToLastSentence('Todo completo. Hasta el final.')).toBe('Todo completo. Hasta el final.');
    expect(trimToLastSentence('¿Quién será el sustituto?')).toBe('¿Quién será el sustituto?');
    expect(trimToLastSentence('¡Se retira!')).toBe('¡Se retira!');
  });

  it('conserva la comilla o el paréntesis que cierran la última frase', () => {
    expect(trimToLastSentence('Dijo "basta ya." Después se fue a ca')).toBe('Dijo "basta ya."');
    expect(trimToLastSentence('Dijo «basta ya». Después se fue a ca')).toBe('Dijo «basta ya».');
    expect(trimToLastSentence('Se retiró (por lesión). Luego se fue a ca')).toBe('Se retiró (por lesión).');
  });

  it('no confunde decimales ni iniciales con el final de una frase', () => {
    expect(trimToLastSentence('Sumó 3.5 puntos de ventaja. Después anunció que')).toBe('Sumó 3.5 puntos de ventaja.');
    expect(trimToLastSentence('Habló con M. Márquez sobre el asunto y no')).toBe('Habló con M. Márquez sobre el asunto y no');
  });

  it('si no hay ninguna frase completa deja el texto como está', () => {
    expect(trimToLastSentence('Una sola frase que se corta ...')).toBe('Una sola frase que se corta ...');
    expect(trimToLastSentence('')).toBe('');
  });
});
