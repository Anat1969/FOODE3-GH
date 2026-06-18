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

export default function MapPage({ positions, update, selectedId, setSelectedId, pinningId, setPinningId }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);

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
    map.on('click', (e) => {
      if (!pinningId) return;
      const pct = lngLatToPct(e.lngLat.lng, e.lngLat.lat);
      update(pinningId, { mapPin: pct });
      setPinningId(null);
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const handler = (e) => {
      if (!pinningId) return;
      const pct = lngLatToPct(e.lngLat.lng, e.lngLat.lat);
      update(pinningId, { mapPin: pct });
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
      if (markersRef.current[p.id]) {
        markersRef.current[p.id].marker.setLngLat([lng, lat]);
        markersRef.current[p.id].el.style.background = color;
        markersRef.current[p.id].el.style.boxShadow = selectedId === p.id ? `0 0 12px ${color}` : `0 2px 6px rgba(0,0,0,0.5)`;
        markersRef.current[p.id].el.style.transform = selectedId === p.id ? 'scale(1.3)' : 'scale(1)';
        existing.delete(p.id);
      } else {
        const el = document.createElement('div');
        el.className = 'map-marker-dot';
        el.style.background = color;
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
        el.addEventListener('click', (e) => { e.stopPropagation(); setSelectedId(p.id); });
        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current);
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
