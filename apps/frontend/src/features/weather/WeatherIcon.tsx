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
import { weatherTone } from './weatherTone';

interface IconVariant {
  day: LucideIcon;
  night: LucideIcon;
}

const ICONS: Readonly<Record<WeatherIconName, IconVariant>> = {
  clear: { day: Sun, night: Moon },
  'mostly-clear': { day: Sun, night: Moon },
  'partly-cloudy': { day: CloudSun, night: CloudMoon },
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
      data-tone={weatherTone(name, isDay)}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}
