import { useEffect, useState } from 'react';
import type { DestinationCard } from '../destinations';
import type { Trip } from './types';

/**
 * How a day's weather was found:
 * - forecast: Open-Meteo forecast (only up to 16 days ahead)
 * - last-year: what the same date was like last year, as a rough guide for trips further out
 * - recorded: what actually happened, for days already in the past
 */
export type WeatherKind = 'forecast' | 'last-year' | 'recorded';
export type DayWeather = { max: number; min: number; rain: number; code: number; kind: WeatherKind };

const FORECAST_DAYS = 16;
const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum';
const cache = new Map<string, Promise<Record<string, Omit<DayWeather, 'kind'>>>>();

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const minusYear = (date: string) => `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`;

function fetchDaily(base: string, lat: number, lng: number, start: string, end: string) {
  const url = `${base}?latitude=${lat}&longitude=${lng}&daily=${DAILY}&timezone=Asia%2FKolkata&start_date=${start}&end_date=${end}`;
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((json) => {
          const d = json.daily;
          return Object.fromEntries(
            (d.time as string[]).map((t, i) => [
              t,
              { code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_sum[i] ?? 0 },
            ]),
          );
        })
        .catch((e) => {
          cache.delete(url); // let a later render retry
          throw e;
        }),
    );
  }
  return cache.get(url)!;
}

/** Weather for each day that has both a date and a base destination, keyed by day id. */
export function useTripWeather(trip: Trip, destinations: Map<string, DestinationCard>) {
  const [weather, setWeather] = useState<Record<string, DayWeather>>({});
  const [failed, setFailed] = useState(false);

  // Only refetch when the dates or bases change, not on every edit to the trip.
  const key = `${trip.startDate}|${trip.days.map((d) => d.destinationId ?? '').join(',')}`;

  useEffect(() => {
    if (!trip.startDate) return setWeather({});
    let cancelled = false;
    const today = iso(new Date());
    const forecastEnd = addDays(today, FORECAST_DAYS - 1);

    // Group the days by destination and how we'll look the weather up.
    const groups = new Map<string, { dest: DestinationCard; kind: WeatherKind; days: { id: string; date: string; lookup: string }[] }>();
    trip.days.forEach((day, i) => {
      const dest = day.destinationId ? destinations.get(day.destinationId) : undefined;
      if (!dest) return;
      const date = addDays(trip.startDate!, i);
      const kind: WeatherKind = date < today ? 'recorded' : date <= forecastEnd ? 'forecast' : 'last-year';
      const lookup = kind === 'last-year' ? minusYear(date) : date;
      const k = `${dest.id}|${kind}`;
      if (!groups.has(k)) groups.set(k, { dest, kind, days: [] });
      groups.get(k)!.days.push({ id: day.id, date, lookup });
    });

    Promise.allSettled(
      [...groups.values()].map(async ({ dest, kind, days }) => {
        const dates = days.map((d) => d.lookup).sort();
        const base = kind === 'forecast' ? 'https://api.open-meteo.com/v1/forecast' : 'https://archive-api.open-meteo.com/v1/archive';
        const data = await fetchDaily(base, dest.coordinates.lat, dest.coordinates.lng, dates[0], dates.at(-1)!);
        return days.flatMap((d) => (data[d.lookup] && data[d.lookup].max !== null ? [[d.id, { ...data[d.lookup], kind }] as const] : []));
      }),
    ).then((results) => {
      if (cancelled) return;
      setFailed(results.some((r) => r.status === 'rejected'));
      setWeather(Object.fromEntries(results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, destinations]);

  return { weather, failed };
}

/** WMO weather codes grouped into a few plain-English kinds. */
export function describeWeather(code: number): { label: string; icon: 'sun' | 'cloud-sun' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm' } {
  if (code === 0) return { label: 'Clear', icon: 'sun' };
  if (code <= 2) return { label: 'Partly cloudy', icon: 'cloud-sun' };
  if (code === 3) return { label: 'Cloudy', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Rain', icon: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Snow', icon: 'snow' };
  if (code >= 95) return { label: 'Thunderstorms', icon: 'storm' };
  return { label: 'Mixed', icon: 'cloud' };
}
