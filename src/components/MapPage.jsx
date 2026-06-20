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

function isPinned(mapPin) {
  return mapPin && (mapPin.x !== 50 || mapPin.y !== 50);
}

function createMarkerEl(name, color, isSelected, pinned) {
  const wrapper = document.createElement('div');
  wrapper.className = 'map-marker-wrapper';

  if (pinned) {
    const pin = document.createElement('div');
    pin.className = `map-marker-pin${isSelected ? ' selected' : ''}`;
    pin.style.setProperty('--pin-color', color);
    pin.innerHTML = `<svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`;
    wrapper.appendChild(pin);
  } else {
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
    wrapper.appendChild(dot);
  }

  const label = document.createElement('div');
  label.className = 'map-marker-label';
  label.textContent = name;

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
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: '&copy; Esri'
          }
        },
        layers: [{
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 22
        }]
      },
      center: ASHDOD_CENTER,
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.on('load', () => setMapReady(true));
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const canvas = map.getCanvas();

    if (!pinningId) {
      canvas.style.cursor = '';
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;z-index:10;cursor:crosshair;';
    map.getCanvasContainer().appendChild(overlay);

    const handleClick = (e) => {
      const rect = map.getCanvas().getBoundingClientRect();
      const point = [e.clientX - rect.left, e.clientY - rect.top];
      const lngLat = map.unproject(point);
      const pct = lngLatToPct(lngLat.lng, lngLat.lat);
      update(pinningRef.current, { mapPin: pct });
      setPinningId(null);
    };
    overlay.addEventListener('click', handleClick);

    return () => {
      overlay.removeEventListener('click', handleClick);
      overlay.remove();
      canvas.style.cursor = '';
    };
  }, [pinningId, update, setPinningId]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const existing = new Set(Object.keys(markersRef.current));
    positions.forEach(p => {
      const [lng, lat] = pctToLngLat(p.mapPin?.x ?? 50, p.mapPin?.y ?? 50);
      const color = STATUS_COLORS[statusColor(p.approval)] || STATUS_COLORS.orange;
      const isSelected = selectedId === p.id;

      const pinned = isPinned(p.mapPin);
      if (markersRef.current[p.id]) {
        markersRef.current[p.id].marker.setLngLat([lng, lat]);
        const oldEl = markersRef.current[p.id].el;
        const newEl = createMarkerEl(p.positionName, color, isSelected, pinned);
        const clickTarget = newEl.querySelector('.map-marker-pin') || newEl.querySelector('.map-marker-dot');
        clickTarget.addEventListener('click', (e) => { e.stopPropagation(); setSelectedId(p.id); });
        oldEl.replaceWith(newEl);
        markersRef.current[p.id].el = newEl;
        existing.delete(p.id);
      } else {
        const el = createMarkerEl(p.positionName, color, isSelected, pinned);
        const clickTarget = el.querySelector('.map-marker-pin') || el.querySelector('.map-marker-dot');
        clickTarget.addEventListener('click', (e) => { e.stopPropagation(); setSelectedId(p.id); });
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
            <button className="primary map-pin-btn" onClick={() => setPinningId(selected.id)}>📍 דקירה על המפה</button>
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
