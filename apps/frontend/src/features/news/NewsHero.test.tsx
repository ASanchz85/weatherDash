import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildNewsItems } from '../../test/newsFixtures';
import { NEWS_FEED_IDS, NEWS_FEED_SOURCES } from '../../types/news';
import { NewsHero } from './NewsHero';

describe('NewsHero', () => {
  const [item] = buildNewsItems(1);

  it('firma el pie de foto con el proveedor recibido', () => {
    render(<NewsHero item={item!} source="Expansión" />);

    expect(screen.getByText('Expansión')).toBeInTheDocument();
    expect(screen.queryByText('Europa Press')).not.toBeInTheDocument();
  });

  it('cada feed tiene un proveedor: Europa Press para nacional e internacional, Expansión para economía y mercados y Wikipedia para efemérides', () => {
    expect(NEWS_FEED_IDS.map((feed) => NEWS_FEED_SOURCES[feed])).toEqual([
      'Europa Press',
      'Europa Press',
      'Expansión',
      'Expansión',
      'Wikipedia',
    ]);
  });
});
