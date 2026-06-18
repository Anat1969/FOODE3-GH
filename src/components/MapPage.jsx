import { useEffect, useRef, useState } from 'react';
import { statusColor } from '../utils/colors.js';
import maplibregl from 'maplibre-gl';

const ASHDOD_CENTER = [34.6415, 31.8014];
const STATUS_COLORS = { green: '#34a853', orange: '#fbbc04', red: '#ea4335' };

function pctToLngLat(x, y) {
  const lng = ASHDOD_CENTER[0] + (x - 50) * 0.004;
  const lat = ASHDOD_CENTER[1] + (50 - y) * 0.003;
  return [lng, lat];
}

function lngLatToPct(lng, lat) {
  const x = Math.round(((lng - ASHDOD_CENTER[0]) / 0.004) + 50);
  const y = Math.round(50 - ((lat - ASHDOD_CENTER[1]) / 0.003));
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

function createMarkerEl(name, color, isSelected) {
  const wrapper = document.createElement('div');
  wrapper.className = 'map-marker-wrapper';

  const dot = document.createElement('div');
  dot.className = 'map-marker-dot';
  dot.style.background = color;
  dot.style.width = isSelected ? '20px' : '16px';
  dot.style.height = isSelected ? '20px' : '16px';
  dot.style.borderRadius = '50%';
  dot.style.border = '2px solid white';
  dot.style.cursor = 'pointer';
  dot.style.transition = 'all 0.2s';
  dot.style.boxShadow = isSelected ? `0 0 12px ${color}` : '0 2px 6px rgba(0,0,0,0.5)';

  const label = document.createElement('div');
  label.className = 'map-marker-label';
  label.textContent = name;

  wrapper.appendChild(dot);
  wrapper.appendChild(label);
  return wrapper;
}

export default function MapPage({ positions, update, selectedId, setSelectedId, pinningId, setPinningId }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const pinningRef = useRef(pinningId);

  useEffect(() => { pinningRef.current = pinningId; }, [pinningId]);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: ASHDOD_CENTER,
      zoom: 14,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.on('load', () => setMapReady(true));
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const handler = (e) => {
      if (!pinningRef.current) return;
      const pct = lngLatToPct(e.lngLat.lng, e.lngLat.lat);
      update(pinningRef.current, { mapPin: pct });
      setPinningId(null);
    };
    mapRef.current.on('click', handler);
    mapRef.current.getCanvas().style.cursor = pinningId ? 'crosshair' : '';
    return () => mapRef.current?.off('click', handler);
  }, [pinningId, update, setPinningId]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const existing = new Set(Object.keys(markersRef.current));
    positions.forEach(p => {
      const [lng, lat] = pctToLngLat(p.mapPin?.x ?? 50, p.mapPin?.y ?? 50);
      const color = STATUS_COLORS[statusColor(p.approval)] || STATUS_COLORS.orange;
      const isSelected = selectedId === p.id;

      if (markersRef.current[p.id]) {
        markersRef.current[p.id].marker.setLngLat([lng, lat]);
        const oldEl = markersRef.current[p.id].el;
        const newEl = createMarkerEl(p.positionName, color, isSelected);
        newEl.querySelector('.map-marker-dot').addEventListener('click', (e) => { e.stopPropagation(); setSelectedId(p.id); });
        oldEl.replaceWith(newEl);
        markersRef.current[p.id].el = newEl;
        existing.delete(p.id);
      } else {
        const el = createMarkerEl(p.positionName, color, isSelected);
        el.querySelector('.map-marker-dot').addEventListener('click', (e) => { e.stopPropagation(); setSelectedId(p.id); });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(mapRef.current);
        markersRef.current[p.id] = { marker, el };
      }
      existing.delete(p.id);
    });
    existing.forEach(id => {
      markersRef.current[id]?.marker.remove();
      delete markersRef.current[id];
    });
  }, [positions, selectedId, mapReady, setSelectedId]);

  const selected = positions.find(p => p.id === selectedId);

  return (
    <section className="map-page glass-panel">
      <div className="map-header">
        <h2>מפת עמדות – אשדוד</h2>
        {pinningId && <div className="pinning-banner">לחצי על המפה כדי למקם את העמדה</div>}
      </div>
      <div className="map-layout">
        <div ref={mapContainer} className="map-3d-container" />
        {selected && (
          <div className="map-info-card glass-panel">
            <h3>{selected.positionName}</h3>
            <p>{selected.complexName} · {selected.businessName}</p>
            <div className="map-info-row">
              <span className={`check-mark-small ${selected.water === 'טוב' ? 'good' : 'bad'}`}>{selected.water === 'טוב' ? '✓' : '✗'} מים</span>
              <span className={`check-mark-small ${selected.electricity === 'טוב' ? 'good' : 'bad'}`}>{selected.electricity === 'טוב' ? '✓' : '✗'} חשמל</span>
              <span className={`check-mark-small ${selected.sewage === 'טוב' ? 'good' : 'bad'}`}>{selected.sewage === 'טוב' ? '✓' : '✗'} ביוב</span>
            </div>
            <div className="map-info-status">
              <span className={`chip ${statusColor(selected.approval)}`}>{selected.approval}</span>
            </div>
            <p className="map-info-coords">מיקום: {selected.mapPin?.x ?? 0}% / {selected.mapPin?.y ?? 0}%</p>
          </div>
        )}
      </div>
      <div className="map-legend">
        <span><span className="legend-dot" style={{background: STATUS_COLORS.green}} /> מקובלת</span>
        <span><span className="legend-dot" style={{background: STATUS_COLORS.orange}} /> בבדיקה</span>
        <span><span className="legend-dot" style={{background: STATUS_COLORS.red}} /> לא מקובלת</span>
      </div>
    </section>
  );
}
