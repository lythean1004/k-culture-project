'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import { CITY_OPTIONS, getCityOption } from '@/lib/recommend/cities';
import { PackageItem } from '@/lib/recommend/types';

interface Props {
  items: PackageItem[];
  cityCode: string;
  cityCodes?: string[];
  onCitySelect?: (code: string) => void;
  activeItemId?: string;
  onItemSelect?: (id: string) => void;
}

export default function CityMap({ items = [], cityCode, cityCodes, onCitySelect, activeItemId, onItemSelect }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap>();
  const layers = useRef<LayerGroup>();
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const callbacks = useRef({ onCitySelect, onItemSelect });
  callbacks.current = { onCitySelect, onItemSelect };
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    import('leaflet').then(L => {
      if (cancelled || !root.current) return;
      const instance = L.map(root.current, { zoomControl: true, scrollWheelZoom: false }).setView([36, 127.8], 7);
      map.current = instance;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 18,
      }).on('tileerror', () => setTileError(true)).addTo(instance);
      layers.current = L.layerGroup().addTo(instance);
      resize = new ResizeObserver(() => instance.invalidateSize());
      resize.observe(root.current);
      setReady(true);
    });
    return () => { cancelled = true; resize?.disconnect(); map.current?.remove(); map.current = undefined; };
  }, []);

  const scope = (cityCodes?.length ? cityCodes : [cityCode]).join(',');
  useEffect(() => {
    if (!ready || !map.current || !layers.current) return;
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !map.current || !layers.current) return;
      const group = layers.current;
      group.clearLayers();
      const selected = scope.split(',');
      const points: [number, number][] = [];
      if (callbacks.current.onCitySelect) {
        CITY_OPTIONS.forEach(city => {
          const chosen = selected.includes(city.code);
          const marker = L.marker([city.lat, city.lng], { icon: L.divIcon({ className: 'city-map-pin', html: `<span class="city-dot ${chosen ? 'chosen' : ''}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] }), keyboard: true, title: city.name, alt: city.name });
          marker.bindTooltip(city.name, { permanent: chosen, direction: 'top', offset: [0, -8] }).on('click', () => callbacks.current.onCitySelect?.(city.code)).addTo(group);
        });
      }
      const byDay = new Map<number, [number, number][]>();
      items.forEach((item, index) => {
        if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
        const position: [number, number] = [item.lat!, item.lng!];
        points.push(position);
        const day = item.dayNumber || 1;
        byDay.set(day, [...(byDay.get(day) || []), position]);
        const marker = L.marker(position, { icon: L.divIcon({ className: 'route-map-pin', html: `<span class="stop-pin day-${day} ${activeItemId === item.id ? 'active' : ''}">${day}.${byDay.get(day)!.length}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] }), title: item.name, alt: item.name });
        const popup = document.createElement('div');
        popup.textContent = `Day ${day} · ${item.name}`;
        marker.bindPopup(popup).on('click', () => callbacks.current.onItemSelect?.(item.id)).addTo(group);
        if (activeItemId === item.id) marker.openPopup();
      });
      byDay.forEach((positions, day) => {
        if (positions.length > 1) L.polyline(positions, { color: ['#087f72', '#e05b48', '#4479bc'][(day - 1) % 3], weight: 3, dashArray: '6 8' }).addTo(group);
      });
      if (!points.length) selected.forEach(code => { const city = getCityOption(code); points.push([city.lat, city.lng]); });
      if (callbacks.current.onCitySelect && !items.length) map.current.fitBounds([[33.1, 125.7], [38.6, 130]], { padding: [24, 24] });
      else map.current.fitBounds(L.latLngBounds(points), { padding: [55, 55], maxZoom: 12 });
    });
    return () => { cancelled = true; };
  }, [ready, items, scope, activeItemId]);

  return <div className="travel-map"><div ref={root} className="travel-map-canvas" aria-label="Travel map" />
    {!ready && <div className="map-loading" role="status">Loading map...</div>}
    {tileError && <div className="map-note">Map tiles are unavailable. Place coordinates remain visible.</div>}
    {items.length > 1 && <div className="map-caption">Stop sequence · dotted lines are not road directions</div>}
  </div>;
}
