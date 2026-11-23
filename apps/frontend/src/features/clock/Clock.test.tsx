import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Clock } from './Clock';

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T23:59:58.400+01:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la hora y la fecha actuales', () => {
    render(<Clock />);

    expect(screen.getByLabelText('23:59:58')).toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('23 de noviembre de 2026')).toBeInTheDocument();
  });

  it('actualiza los segundos alineándose con el inicio de cada segundo', () => {
    render(<Clock />);
    const seconds = screen.getByTestId('clock-seconds');

    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(seconds).toHaveTextContent('58');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(seconds).toHaveTextContent('59');
  });

  it('cambia la fecha al pasar la medianoche', () => {
    render(<Clock />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByLabelText('00:00:00')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('24 de noviembre de 2026')).toBeInTheDocument();
  });

  it('no acumula temporizadores y los libera al desmontarse', () => {
    const { unmount } = render(<Clock />);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
