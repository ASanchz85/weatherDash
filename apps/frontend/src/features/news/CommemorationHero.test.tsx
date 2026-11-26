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
  it('muestra la fecha completa y el texto como descripción, sin titular', () => {
    render(<CommemorationHero item={item} source="Wikipedia" />);

    expect(screen.getByText('26 de noviembre de 2018')).toBeInTheDocument();
    expect(screen.getByText(item.description)).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('firma el pie de foto con el proveedor y usa la imagen de la efeméride', () => {
    const { container } = render(<CommemorationHero item={item} source="Wikipedia" />);

    expect(screen.getByText('Wikipedia')).toBeInTheDocument();
    expect(container.querySelector('[data-hero-image="photo"]')?.getAttribute('style')).toContain('InSight.jpg');
  });
});
