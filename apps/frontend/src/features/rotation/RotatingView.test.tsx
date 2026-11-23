import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROTATION_FADE_MS } from '../../config';
import { RotatingView, type RotatingViewItem } from './RotatingView';

const views: RotatingViewItem[] = [
  { id: 'a', content: <p>Vista A</p> },
  { id: 'b', content: <p>Vista B</p> },
];

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query }));
}

describe('RotatingView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('muestra la vista de la página activa sin animar en el primer render', () => {
    const { container } = render(<RotatingView views={views} page={0} />);

    expect(screen.getByText('Vista A')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-fading', 'false');
  });

  it('funde la vista actual y la sustituye al terminar la salida', () => {
    const { container, rerender } = render(<RotatingView views={views} page={0} />);

    rerender(<RotatingView views={views} page={1} />);
    expect(container.firstElementChild).toHaveAttribute('data-fading', 'true');
    expect(screen.getByText('Vista A')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(ROTATION_FADE_MS);
    });
    expect(screen.getByText('Vista B')).toBeInTheDocument();
    expect(screen.queryByText('Vista A')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-fading', 'false');
  });

  it('vuelve a la primera vista al completar el ciclo', () => {
    const { rerender } = render(<RotatingView views={views} page={0} />);

    rerender(<RotatingView views={views} page={1} />);
    act(() => {
      vi.advanceTimersByTime(ROTATION_FADE_MS);
    });
    rerender(<RotatingView views={views} page={2} />);
    act(() => {
      vi.advanceTimersByTime(ROTATION_FADE_MS);
    });

    expect(screen.getByText('Vista A')).toBeInTheDocument();
  });

  it('refleja el contenido nuevo de la vista visible sin esperar a un cambio', () => {
    const { rerender } = render(<RotatingView views={views} page={0} />);

    rerender(
      <RotatingView views={[{ id: 'a', content: <p>Vista A actualizada</p> }, views[1]!]} page={0} />,
    );

    expect(screen.getByText('Vista A actualizada')).toBeInTheDocument();
  });

  it('no usa temporizadores con una sola vista', () => {
    render(<RotatingView views={[views[0]!]} page={0} />);

    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByText('Vista A')).toBeInTheDocument();
  });

  it('cambia al instante si el usuario prefiere movimiento reducido', () => {
    mockReducedMotion(true);
    const { rerender } = render(<RotatingView views={views} page={0} />);

    rerender(<RotatingView views={views} page={1} />);

    expect(screen.getByText('Vista B')).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
});
