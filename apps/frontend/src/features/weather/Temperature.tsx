import type { ComponentProps } from 'react';

import { formatTemperature } from './weatherFormat';
import { temperatureStyle, temperatureTone } from './temperatureTone';

type TemperatureProps = { value: number | null } & Omit<ComponentProps<'span'>, 'children' | 'style'>;

/** Temperatura formateada y coloreada según su tramo. */
export function Temperature({ value, ...props }: TemperatureProps) {
  return (
    <span {...props} style={temperatureStyle(value)} data-temperature-tone={temperatureTone(value)}>
      {formatTemperature(value)}
    </span>
  );
}
