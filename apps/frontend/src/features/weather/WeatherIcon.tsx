import {
  CircleHelp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudMoonRain,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';

import type { WeatherIconName } from '../../types/weather';

interface IconVariant {
  day: LucideIcon;
  night: LucideIcon;
  /** Tono cálido para condiciones soleadas diurnas. */
  warm?: boolean;
}

const ICONS: Readonly<Record<WeatherIconName, IconVariant>> = {
  clear: { day: Sun, night: Moon, warm: true },
  'mostly-clear': { day: Sun, night: Moon, warm: true },
  'partly-cloudy': { day: CloudSun, night: CloudMoon, warm: true },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  sleet: { day: CloudHail, night: CloudHail },
  snow: { day: CloudSnow, night: CloudSnow },
  showers: { day: CloudSunRain, night: CloudMoonRain },
  thunderstorm: { day: CloudLightning, night: CloudLightning },
  unknown: { day: CircleHelp, night: CircleHelp },
};

interface WeatherIconProps {
  name: WeatherIconName;
  isDay: boolean;
  className?: string;
}

export function WeatherIcon({ name, isDay, className }: WeatherIconProps) {
  const variant = ICONS[name];
  const Icon = isDay ? variant.day : variant.night;

  return (
    <Icon
      className={className}
      data-tone={isDay && variant.warm ? 'warm' : 'neutral'}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}
