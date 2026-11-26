import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MoonPhase } from './MoonPhase';
import { moonLitPath } from './MoonPhaseIcon';

describe('moonLitPath', () => {
  it('no dibuja zona iluminada en luna nueva y dibuja un círculo en luna llena', () => {
    expect(moonLitPath(0)).toBeNull();
    expect(moonLitPath(1)).toContain('A 50 50 0 1 1');
  });

  it('en cuarto el terminador es una recta; en creciente abomba hacia la zona iluminada y en gibosa hacia la oscura', () => {
    expect(moonLitPath(0.5)).toContain('A 0.00 50');
    expect(moonLitPath(0.25)).toContain('A 25.00 50 0 0 0');
    expect(moonLitPath(0.75)).toContain('A 25.00 50 0 0 1');
  });
});

describe('MoonPhase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T23:10:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la frase con el nombre de la fase y el porcentaje', () => {
    const { getByTestId } = render(<MoonPhase />);

    expect(getByTestId('moon-phase')).toHaveTextContent('Luna gibosa menguante · 97 %');
  });

  it('refleja la luna menguante invirtiendo el icono', () => {
    const { container } = render(<MoonPhase />);

    expect(container.querySelector('path')?.getAttribute('transform')).toBe('translate(100 0) scale(-1 1)');
  });
});
