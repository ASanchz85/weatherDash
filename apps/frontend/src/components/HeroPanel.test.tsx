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

  it('con una foto propia sustituye a las fotos de día y de noche', () => {
    const { container } = render(
      <HeroPanel label="Noticia" imageUrl="https://img.example.com/foto_800.jpg">
        <p>Contenido</p>
      </HeroPanel>,
    );

    const images = container.querySelectorAll<HTMLElement>('[data-hero-image]');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('data-hero-image', 'custom');
    expect(images[0]?.style.backgroundImage).toContain('https://img.example.com/foto_800.jpg');
  });
});
