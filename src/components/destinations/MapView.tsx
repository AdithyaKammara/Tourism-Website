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
      markers.current = points.map((p) => {
        const el = document.createElement('a');
        el.href = `/destinations/${p.id}`;
        el.setAttribute('aria-label', `${p.label ? `Stop ${p.label}: ` : ''}${p.name}`);
        el.className = [
          'grid place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-md transition-transform hover:scale-110',
          p.label ? 'size-7' : p.active ? 'size-5' : 'size-4',
          p.active || p.label ? 'bg-[#4a5d3a]' : 'bg-[#6f8248]',
        ].join(' ');
        if (p.label) el.textContent = p.label;
        const popup = new maplibre.Popup({ offset: 14, closeButton: false }).setHTML(
          `<strong>${escapeHtml(p.name)}</strong>${p.note ? `<br><span>${escapeHtml(p.note)}</span>` : ''}`,
        );
        el.addEventListener('mouseenter', () => popup.setLngLat([p.lng, p.lat]).addTo(map));
        el.addEventListener('mouseleave', () => popup.remove());
        el.addEventListener('focus', () => popup.setLngLat([p.lng, p.lat]).addTo(map));
        el.addEventListener('blur', () => popup.remove());
        return new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      });

      const line = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: route ? points.map((p) => [p.lng, p.lat]) : [] },
      };
      const drawRoute = () => {
        if (cancelled) return;
        const source = map.getSource('route') as GeoJSONSource | undefined;
        if (source) return source.setData(line);
        map.addSource('route', { type: 'geojson', data: line });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#4a5d3a', 'line-width': 2.5, 'line-dasharray': [2, 1.5] },
        });
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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
