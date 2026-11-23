import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WindRose } from './WindRose';

describe('WindRose', () => {
  it('describe la dirección de forma accesible', () => {
    render(<WindRose directionDegrees={90} />);

    expect(screen.getByRole('img', { name: 'Viento del E (90°)' })).toBeInTheDocument();
  });

  it('apunta la flecha hacia donde sopla el viento, opuesta a su procedencia', () => {
    const { rerender } = render(<WindRose directionDegrees={90} />);
    expect(screen.getByTestId('wind-arrow')).toHaveAttribute('transform', 'rotate(270 50 50)');

    rerender(<WindRose directionDegrees={0} />);
    expect(screen.getByTestId('wind-arrow')).toHaveAttribute('transform', 'rotate(180 50 50)');

    rerender(<WindRose directionDegrees={360} />);
    expect(screen.getByTestId('wind-arrow')).toHaveAttribute('transform', 'rotate(180 50 50)');
  });

  it('muestra los cuatro puntos cardinales en español', () => {
    const { container } = render(<WindRose directionDegrees={45} />);

    const labels = [...container.querySelectorAll('text')].map((text) => text.textContent);
    expect(labels).toEqual(['N', 'E', 'S', 'O']);
  });

  it('no dibuja la flecha si no hay dirección', () => {
    render(<WindRose directionDegrees={null} />);

    expect(screen.getByRole('img', { name: 'Dirección del viento no disponible' })).toBeInTheDocument();
    expect(screen.queryByTestId('wind-arrow')).not.toBeInTheDocument();
  });
});
