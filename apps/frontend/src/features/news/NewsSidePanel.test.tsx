import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildNewsRotation } from '../../test/newsFixtures';
import { NewsSidePanel } from './NewsSidePanel';

function slotsOf(list: HTMLElement): string {
  return list.style.getPropertyValue('--slots');
}

describe('NewsSidePanel', () => {
  it('reserva el hueco del tama\u00f1o de la rotaci\u00f3n aunque haya menos noticias', () => {
    render(<NewsSidePanel rotation={buildNewsRotation('national', 2, 5)} activeIndex={0} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(slotsOf(screen.getByRole('list'))).toBe('5');
  });

  it('nunca reserva menos huecos que noticias', () => {
    render(<NewsSidePanel rotation={buildNewsRotation('national', 4, 2)} activeIndex={0} />);

    expect(slotsOf(screen.getByRole('list'))).toBe('4');
  });

  it('da tres l\u00edneas a cada titular con pocos huecos y dos con muchos', () => {
    const { rerender } = render(<NewsSidePanel rotation={buildNewsRotation('national', 3, 5)} activeIndex={0} />);
    expect(screen.getByRole('list').style.getPropertyValue('--lines')).toBe('3');

    rerender(<NewsSidePanel rotation={buildNewsRotation('national', 3, 8)} activeIndex={0} />);
    expect(screen.getByRole('list').style.getPropertyValue('--lines')).toBe('2');
  });

  it('resalta la noticia activa y muestra el nombre del feed', () => {
    render(<NewsSidePanel rotation={buildNewsRotation('markets', 3, 5)} activeIndex={1} />);

    expect(screen.getByRole('heading', { name: 'Mercados' })).toBeInTheDocument();
    expect(screen.getByText('Titular 2').closest('li')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Titular 1').closest('li')).not.toHaveAttribute('aria-current');
  });
});
