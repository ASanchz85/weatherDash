import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildNewsItems } from '../../test/newsFixtures';
import { NEWS_FEED_IDS, NEWS_FEEDS } from '../../types/news';
import { NewsHero } from './NewsHero';

describe('NewsHero', () => {
  const [item] = buildNewsItems(1);

  it('firma el pie de foto con el proveedor recibido', () => {
    render(<NewsHero item={item!} source="Expansión" />);

    expect(screen.getByText('Expansión')).toBeInTheDocument();
    expect(screen.queryByText('Europa Press')).not.toBeInTheDocument();
  });

  it('cada feed tiene un proveedor: Europa Press para nacional e internacional, Expansión para economía y mercados, Wikipedia para efemérides, Motorsport.com y NBAManiacs', () => {
    expect(NEWS_FEED_IDS.map((feed) => NEWS_FEEDS[feed].source)).toEqual([
      'Europa Press',
      'Europa Press',
      'Expansión',
      'Expansión',
      'Wikipedia',
      'Motorsport.com',
      'NBAManiacs',
    ]);
  });
});
