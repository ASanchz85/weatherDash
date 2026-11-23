import { formatWindDirection } from './windAirFormat';

interface WindRoseProps {
  /** Dirección de la que viene el viento, en grados (0 = norte); null si no hay dato. */
  directionDegrees: number | null;
  className?: string;
}

const CENTER = 50;
const RING_RADIUS = 46;
const LABEL_RADIUS = 34;
const INTERCARDINAL_ANGLES = [45, 135, 225, 315] as const;
const CARDINAL_LABELS = [
  { text: 'N', angle: 0 },
  { text: 'E', angle: 90 },
  { text: 'S', angle: 180 },
  { text: 'O', angle: 270 },
] as const;

function polar(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.sin(radians), y: CENTER - radius * Math.cos(radians) };
}

/** Rosa de los vientos en SVG: la flecha apunta hacia donde sopla el viento, es decir, opuesta a su procedencia. */
export function WindRose({ directionDegrees, className }: WindRoseProps) {
  const label =
    directionDegrees === null
      ? 'Dirección del viento no disponible'
      : `Viento del ${formatWindDirection(directionDegrees)} (${Math.round(directionDegrees)}°)`;

  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label={label}>
      <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} fill="none" stroke="var(--color-border-subtle)" strokeWidth="2" />
      {INTERCARDINAL_ANGLES.map((angle) => {
        const outer = polar(angle, RING_RADIUS);
        const inner = polar(angle, RING_RADIUS - 5);
        return (
          <line
            key={angle}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="var(--color-text-faint)"
            strokeWidth="1.5"
          />
        );
      })}
      {CARDINAL_LABELS.map(({ text, angle }) => {
        const { x, y } = polar(angle, LABEL_RADIUS + 7);
        return (
          <text
            key={text}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight={text === 'N' ? 700 : 400}
            fill={text === 'N' ? 'var(--color-text)' : 'var(--color-text-muted)'}
          >
            {text}
          </text>
        );
      })}
      {directionDegrees !== null && (
        <g transform={`rotate(${(directionDegrees + 180) % 360} ${CENTER} ${CENTER})`} data-testid="wind-arrow">
          <polygon points="50,24 57,60 50,53 43,60" fill="var(--color-accent)" />
        </g>
      )}
      <circle cx={CENTER} cy={CENTER} r="3" fill="var(--color-text)" />
    </svg>
  );
}
