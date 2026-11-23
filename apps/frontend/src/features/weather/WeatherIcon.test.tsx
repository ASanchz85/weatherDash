import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WeatherIcon } from './WeatherIcon';

function toneOf(name: Parameters<typeof WeatherIcon>[0]['name'], isDay: boolean): string | null {
  const { container } = render(<WeatherIcon name={name} isDay={isDay} />);
  return container.querySelector('svg')?.getAttribute('data-tone') ?? null;
}

describe('WeatherIcon', () => {
  it('marca el sol de día con el tono del sol', () => {
    expect(toneOf('clear', true)).toBe('sun');
    expect(toneOf('mostly-clear', true)).toBe('sun');
  });

  it('marca las condiciones con lluvia con el tono de la lluvia, de día y de noche', () => {
    expect(toneOf('rain', true)).toBe('rain');
    expect(toneOf('showers', false)).toBe('rain');
    expect(toneOf('drizzle', true)).toBe('rain');
  });

  it('no destaca el cielo nublado, parcialmente nublado ni despejado de noche', () => {
    expect(toneOf('cloudy', true)).toBe('neutral');
    expect(toneOf('partly-cloudy', true)).toBe('neutral');
    expect(toneOf('clear', false)).toBe('neutral');
  });
});
