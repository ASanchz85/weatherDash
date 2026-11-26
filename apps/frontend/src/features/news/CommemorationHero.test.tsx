import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CommemorationHero } from './CommemorationHero';

const item = {
  id: 1,
  title: 'Aterriza en Marte la misión InSight de la NASA.',
  description: 'Aterriza en Marte la misión InSight de la NASA.',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/InSight.jpg/960px-InSight.jpg',
  publishedAt: '2026-11-25T23:00:00.000Z',
  category: '26 de noviembre de 2018',
};

describe('CommemorationHero', () => {
  it('muestra el día y el mes, el año aparte y el texto como descripción, sin titular', () => {
    render(<CommemorationHero item={item} source="Wikipedia" />);

    expect(screen.getByText('26 de noviembre')).toBeInTheDocument();
    expect(screen.getByText('2018')).toBeInTheDocument();
    expect(screen.getByText(item.description)).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('escala el año según los caracteres del día y el mes para igualar el ancho de ambas líneas', () => {
    render(<CommemorationHero item={item} source="Wikipedia" />);

    // «26 de noviembre» (15 caracteres) frente a «2018» (4).
    expect(screen.getByText('2018').closest('p')?.style.getPropertyValue('--year-scale')).toBe('3.75');
  });

  it('muestra la categoría tal cual si no tiene el formato de fecha esperado', () => {
    render(<CommemorationHero item={{ ...item, category: 'Efemérides' }} source="Wikipedia" />);

    expect(screen.getByText('Efemérides')).toBeInTheDocument();
  });

  it('firma el pie de foto con el proveedor y usa la imagen de la efeméride', () => {
    const { container } = render(<CommemorationHero item={item} source="Wikipedia" />);

    expect(screen.getByText('Wikipedia')).toBeInTheDocument();
    expect(container.querySelector('[data-hero-image="photo"]')?.getAttribute('style')).toContain('InSight.jpg');
  });
});
