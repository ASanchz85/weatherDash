import { render, screen, within } from '@testing-library/react';
import { Sun } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { Metric } from './Metric';

function renderMetric(props: Partial<Parameters<typeof Metric>[0]> = {}) {
  return render(
    <dl>
      <Metric icon={Sun} label="Índice UV" value="3" {...props} />
    </dl>,
  );
}

describe('Metric', () => {
  it('muestra la etiqueta y el valor', () => {
    renderMetric();

    expect(screen.getByText('Índice UV')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('muestra un detalle junto al valor y marca el tono', () => {
    const { container } = renderMetric({ value: '22', detail: 'Razonable', tone: 'good' });

    expect(within(container).getByText('Razonable')).toBeInTheDocument();
    expect(container.querySelector('[data-tone="good"]')).not.toBeNull();
  });

  it('no marca ningún tono por defecto', () => {
    const { container } = renderMetric();

    expect(container.querySelector('[data-tone]')).toBeNull();
  });
});
