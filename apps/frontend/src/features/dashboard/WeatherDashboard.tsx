import { DashboardLayout } from '../../components/DashboardLayout';
import { ForecastPanel } from '../../components/ForecastPanel';
import { HeroPanel } from '../../components/HeroPanel';
import { SidePanel } from '../../components/SidePanel';
import type { Theme } from '../../types/theme';
import { Clock } from '../clock/Clock';
import { HourlyForecast } from '../forecast/HourlyForecast';
import { WeeklyForecast } from '../forecast/WeeklyForecast';
import { RotatingView, type RotatingViewItem } from '../rotation/RotatingView';
import { WeatherPanel } from '../weather/WeatherPanel';
import { WindAirPanel } from '../wind-air/WindAirPanel';
import type { AirQualityState, WeatherState } from './useDashboardData';

/** Vistas distintas del tiempo que se alternan en la card lateral y en la franja inferior. */
export const WEATHER_PAGE_COUNT = 2;

interface WeatherDashboardProps {
  weather: WeatherState;
  airQuality: AirQualityState;
  page: number;
  theme: Theme;
}

export function WeatherDashboard({ weather, airQuality, page, theme }: WeatherDashboardProps) {
  const sideViews: RotatingViewItem[] = [
    { id: 'weather', content: <WeatherPanel state={weather} /> },
    { id: 'wind-air', content: <WindAirPanel weather={weather} airQuality={airQuality} /> },
  ];
  const bottomViews: RotatingViewItem[] = [
    { id: 'weekly', content: <WeeklyForecast state={weather} /> },
    { id: 'hourly', content: <HourlyForecast state={weather} /> },
  ];

  return (
    <DashboardLayout>
      <HeroPanel label="Fecha y hora" theme={theme}>
        <Clock />
      </HeroPanel>
      <SidePanel label="Meteorología">
        <RotatingView views={sideViews} page={page} />
      </SidePanel>
      <ForecastPanel label="Predicción">
        <RotatingView views={bottomViews} page={page} />
      </ForecastPanel>
    </DashboardLayout>
  );
}
