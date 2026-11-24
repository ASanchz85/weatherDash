import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ROTATION_FADE_MS } from '../config';
import { HeroPanel } from './HeroPanel';

describe('HeroPanel', () => {
  it('muestra la foto indicada y marca el tema activo', () => {
    const { container, rerender } = render(
      <HeroPanel label="Fecha y hora" theme="day" imageUrl="/assets/day/a.webp">
        <p>Contenido</p>
      </HeroPanel>,
    );

    const hero = screen.getByRole('region', { name: 'Fecha y hora' });
    expect(hero).toHaveAttribute('data-theme', 'day');
    expect(container.querySelectorAll('[data-hero-image]')).toHaveLength(1);
    expect(screen.getByText('Contenido')).toBeInTheDocument();

    rerender(
      <HeroPanel label="Fecha y hora" theme="night" imageUrl="/assets/night/b.webp">
        <p>Contenido</p>
      </HeroPanel>,
    );
    expect(hero).toHaveAttribute('data-theme', 'night');
  });

  it('funde la foto nueva sobre la anterior y después deja solo la nueva', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <HeroPanel label="Hero" imageUrl="/a.webp">
        <p>Contenido</p>
      </HeroPanel>,
    );

    rerender(
      <HeroPanel label="Hero" imageUrl="/b.webp">
        <p>Contenido</p>
      </HeroPanel>,
    );
    const during = [...container.querySelectorAll<HTMLElement>('[data-hero-image]')];
    expect(during.map((layer) => layer.style.backgroundImage)).toEqual([expect.stringContaining('/a.webp'), expect.stringContaining('/b.webp')]);

    act(() => {
      vi.advanceTimersByTime(ROTATION_FADE_MS * 2 + 100);
    });
    const after = container.querySelectorAll<HTMLElement>('[data-hero-image]');
    expect(after).toHaveLength(1);
    expect(after[0]?.style.backgroundImage).toContain('/b.webp');
    vi.useRealTimers();
  });

  it('sin foto no dibuja capas de imagen', () => {
    const { container } = render(
      <HeroPanel label="Hero" imageUrl={null}>
        <p>Contenido</p>
      </HeroPanel>,
    );

    expect(container.querySelectorAll('[data-hero-image]')).toHaveLength(0);
  });

  it('la variante de noticias se marca para añadir su capa de oscurecimiento y muestra el pie de foto', () => {
    render(
      <HeroPanel label="Noticia" imageUrl="/n.webp" variant="news" caption="Europa Press">
        <p>Contenido</p>
      </HeroPanel>,
    );

    expect(screen.getByRole('region', { name: 'Noticia' })).toHaveAttribute('data-variant', 'news');
    expect(screen.getByText('Europa Press')).toBeInTheDocument();
  });

  it('la variante por defecto no lleva la capa extra ni pie de foto', () => {
    render(
      <HeroPanel label="Hero" imageUrl="/n.webp">
        <p>Contenido</p>
      </HeroPanel>,
    );

    expect(screen.getByRole('region', { name: 'Hero' })).toHaveAttribute('data-variant', 'default');
  });
});
