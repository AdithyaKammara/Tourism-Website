import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react';
import { describeWeather, type DayWeather } from '../../lib/planner/weather';

const ICONS = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

const KIND_LABEL: Record<DayWeather['kind'], string> = {
  forecast: 'Forecast',
  'last-year': 'Same day last year',
  recorded: 'Recorded',
};

export default function WeatherChip({ w }: { w: DayWeather }) {
  const { label, icon } = describeWeather(w.code);
  const Icon = ICONS[icon];
  const rain = w.rain >= 1 ? `, ${Math.round(w.rain)} mm rain` : '';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-xs"
      title={`${KIND_LABEL[w.kind]}: ${label}, high ${Math.round(w.max)}°C, low ${Math.round(w.min)}°C${rain}`}
    >
      <Icon className="size-4 text-moss" aria-hidden="true" />
      <span className="sr-only">{label}, </span>
      {Math.round(w.max)}° / {Math.round(w.min)}°
      {rain && <span className="text-ink-soft">· {Math.round(w.rain)} mm</span>}
      <span className="text-ink-soft">· {KIND_LABEL[w.kind]}</span>
    </span>
  );
}
