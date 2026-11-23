import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HeroPanel } from './HeroPanel';

describe('HeroPanel', () => {
  it('muestra las dos fotos y marca el tema activo', () => {
    const { container, rerender } = render(
      <HeroPanel label="Fecha y hora" theme="day">
        <p>Contenido</p>
      </HeroPanel>,
    );

    const hero = screen.getByRole('region', { name: 'Fecha y hora' });
    expect(hero).toHaveAttribute('data-theme', 'day');
    expect(container.querySelectorAll('[data-hero-image]')).toHaveLength(2);
    expect(screen.getByText('Contenido')).toBeInTheDocument();

    rerender(
      <HeroPanel label="Fecha y hora" theme="night">
        <p>Contenido</p>
      </HeroPanel>,
    );
    expect(hero).toHaveAttribute('data-theme', 'night');
  });
});
