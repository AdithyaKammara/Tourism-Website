import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Highlighted marker (the page's own destination). */
  active?: boolean;
  /** Shown inside the marker, e.g. the stop number on a trip route. */
  label?: string;
  note?: string;
};

// The package is UMD; depending on the bundler the API arrives as the default export or the namespace.
const loadMaplibre = () =>
  import('maplibre-gl').then((m) => (m as unknown as { default?: typeof m }).default ?? m);

// Free vector tiles from OpenFreeMap; no API key needed.
const STYLE = 'https://tiles.openfreemap.org/styles/positron';

type Props = {
  points: MapPoint[];
  /** Draw a line through the points in order. */
  route?: boolean;
  focusId?: string;
  ariaLabel?: string;
};

export default function MapView({ points, route = false, focusId, ariaLabel = 'Map of destinations' }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Create the map once; maplibre-gl is loaded lazily so it never weighs down pages without a map.
  useEffect(() => {
    let cancelled = false;
    loadMaplibre()
      .then((maplibre) => {
        if (cancelled || !container.current) return;
        const map = new maplibre.Map({
          container: container.current,
          style: STYLE,
          center: [78.9, 22.5],
          zoom: 3.6,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
        map.on('error', (e) => {
          if (!map.loaded() && String(e.error?.message ?? '').includes('style')) setFailed(true);
        });
        mapRef.current = map;
        // Markers are plain DOM, so they can go on straight away; the route waits for the style.
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers, the route line and the view whenever the points change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    loadMaplibre().then((maplibre) => {
      if (cancelled) return;
      markers.current.forEach((m) => m.remove());
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      markers.current = points.map((p, i) => {
        // MapLibre positions the outer element with a transform, so the drop-in animation lives on an inner dot.
        const el = document.createElement('a');
        el.href = `/destinations/${p.id}`;
        el.setAttribute('aria-label', `${p.label ? `Stop ${p.label}: ` : ''}${p.name}`);
        const dot = document.createElement('span');
        dot.className = [
          'grid place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-md transition-transform duration-200 hover:scale-110',
          p.label ? 'size-7' : p.active ? 'size-5' : 'size-4',
          p.active || p.label ? 'bg-[#16706a]' : 'bg-[#23938b]',
          reduceMotion ? '' : 'animate-pop',
        ].join(' ');
        dot.style.setProperty('--delay', `${i * 140}ms`);
        if (p.label) dot.textContent = p.label;
        el.append(dot);
        const popup = new maplibre.Popup({ offset: 14, closeButton: false }).setHTML(
          `<strong>${escapeHtml(p.name)}</strong>${p.note ? `<br><span>${escapeHtml(p.note)}</span>` : ''}`,
        );
        el.addEventListener('mouseenter', () => popup.setLngLat([p.lng, p.lat]).addTo(map));
        el.addEventListener('mouseleave', () => popup.remove());
        el.addEventListener('focus', () => popup.setLngLat([p.lng, p.lat]).addTo(map));
        el.addEventListener('blur', () => popup.remove());
        return new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      });

      const full: [number, number][] = route ? points.map((p) => [p.lng, p.lat]) : [];
      const lineOf = (coordinates: [number, number][]) => ({
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates },
      });
      const drawRoute = () => {
        if (cancelled) return;
        let source = map.getSource('route') as GeoJSONSource | undefined;
        if (!source) {
          map.addSource('route', { type: 'geojson', data: lineOf([]) });
          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#16706a', 'line-width': 3 },
          });
          source = map.getSource('route') as GeoJSONSource;
        }
        if (reduceMotion || full.length < 2) return source.setData(lineOf(full));
        drawLine(source, full, lineOf, points.length * 140, () => cancelled);
      };
      if (map.isStyleLoaded()) drawRoute();
      else map.once('load', drawRoute);

      if (points.length === 0) return;
      const focus = points.find((p) => p.id === focusId);
      if (points.length === 1 || (focus && !route)) {
        const p = focus ?? points[0];
        map.jumpTo({ center: [p.lng, p.lat], zoom: points.length === 1 ? 6.5 : 4.6 });
      } else {
        const bounds = new maplibre.LngLatBounds();
        points.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 7, animate: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [points, ready, route, focusId]);

  return (
    <div className="relative size-full bg-sage-soft" role="region" aria-label={ariaLabel}>
      <div ref={container} className="size-full" />
      {failed && (
        <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-ink-soft">
          The map couldn’t load. Check your connection and refresh.
        </p>
      )}
    </div>
  );
}

/** Grows the route from the first stop to the last over about a second, after the markers have landed. */
function drawLine(
  source: GeoJSONSource,
  coords: [number, number][],
  lineOf: (c: [number, number][]) => Parameters<GeoJSONSource['setData']>[0],
  delay: number,
  isCancelled: () => boolean,
) {
  const lengths = coords.slice(1).map((c, i) => Math.hypot(c[0] - coords[i][0], c[1] - coords[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const duration = 1100;
  let startTime: number | null = null;
  const frame = (now: number) => {
    if (isCancelled()) return;
    startTime ??= now + delay;
    const t = Math.min(1, Math.max(0, (now - startTime) / duration));
    const eased = 1 - Math.pow(1 - t, 3);
    let remaining = eased * total;
    const partial: [number, number][] = [coords[0]];
    for (let i = 0; i < lengths.length && remaining > 0; i++) {
      const [a, b] = [coords[i], coords[i + 1]];
      const f = Math.min(1, remaining / (lengths[i] || 1));
      partial.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      remaining -= lengths[i];
    }
    source.setData(lineOf(partial));
    if (t < 1) requestAnimationFrame(frame);
  };
  source.setData(lineOf([]));
  requestAnimationFrame(frame);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
