import { useEffect, useRef, useState, useCallback } from 'react';
import { statusColor } from '../utils/colors.js';
import maplibregl from 'maplibre-gl';

const ASHDOD_CENTER = [34.6415, 31.8014];
const STATUS_COLORS = { green: '#34a853', orange: '#fbbc04', red: '#ea4335' };

function isPinned(mapPin) {
  if (!mapPin) return false;
  return Math.abs(mapPin.x - ASHDOD_CENTER[0]) > 0.0001 || Math.abs(mapPin.y - ASHDOD_CENTER[1]) > 0.0001;
}

function createMarkerEl(name, color, isSelected, pinned) {
  const wrapper = document.createElement('div');
  wrapper.className = 'map-marker-wrapper';

  if (pinned) {
    const pin = document.createElement('div');
    pin.className = `map-marker-pin${isSelected ? ' selected' : ''}`;
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

function buildGrid() {
  const lines = [];
  for (let lng = 34.60; lng <= 34.70; lng += 0.005) {
    lines.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[lng, 31.76], [lng, 31.84]] } });
  }
  for (let lat = 31.76; lat <= 31.84; lat += 0.005) {
    lines.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[34.60, lat], [34.70, lat]] } });
  }
  return { type: 'FeatureCollection', features: lines };
}

export default function MapPage({ positions, update, selectedId, setSelectedId, pinningId, setPinningId }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [cursorCoord, setCursorCoord] = useState(null);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '&copy; Esri'
          }
        },
        layers: [{ id: 'satellite-layer', type: 'raster', source: 'satellite', minzoom: 0, maxzoom: 22 }]
      },
      center: ASHDOD_CENTER,
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.on('load', () => {
      map.addSource('grid', { type: 'geojson', data: buildGrid() });
      map.addLayer({ id: 'grid-lines', type: 'line', source: 'grid', paint: { 'line-color': 'rgba(255,255,255,0.25)', 'line-width': 1 } });
      setMapReady(true);
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  const handleOverlayClick = useCallback((e) => {
    const map = mapRef.current;
    if (!map || !pinningId) return;
    const rect = mapContainer.current.getBoundingClientRect();
    const lngLat = map.unproject([e.clientX - rect.left, e.clientY - rect.top]);
    update(pinningId, { mapPin: { x: lngLat.lng, y: lngLat.lat } });
    setPinningId(null);
    setCursorCoord(null);
  }, [pinningId, update, setPinningId]);

  const handleOverlayMove = useCallback((e) => {
    const map = mapRef.current;
    if (!map) return;
    const rect = mapContainer.current.getBoundingClientRect();
    const lngLat = map.unproject([e.clientX - rect.left, e.clientY - rect.top]);
    setCursorCoord({ lng: lngLat.lng.toFixed(5), lat: lngLat.lat.toFixed(5), px: e.clientX - rect.left, py: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const existing = new Set(Object.keys(markersRef.current));
    positions.forEach(p => {
      const lng = p.mapPin?.x ?? ASHDOD_CENTER[0];
      const lat = p.mapPin?.y ?? ASHDOD_CENTER[1];
      const color = STATUS_COLORS[statusColor(p.approval)] || STATUS_COLORS.orange;
      const isSelected = selectedId === p.id;
      const pinned = isPinned(p.mapPin);

      if (markersRef.current[p.id]) {
        markersRef.current[p.id].marker.setLngLat([lng, lat]);
        const oldEl = markersRef.current[p.id].el;
        const newEl = createMarkerEl(p.positionName, color, isSelected, pinned);
        const clickTarget = newEl.querySelector('.map-marker-pin') || newEl.querySelector('.map-marker-dot');
        clickTarget.addEventListener('click', (ev) => { ev.stopPropagation(); setSelectedId(p.id); });
        oldEl.replaceWith(newEl);
        markersRef.current[p.id].el = newEl;
      } else {
        const el = createMarkerEl(p.positionName, color, isSelected, pinned);
        const clickTarget = el.querySelector('.map-marker-pin') || el.querySelector('.map-marker-dot');
        clickTarget.addEventListener('click', (ev) => { ev.stopPropagation(); setSelectedId(p.id); });
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
  const pinningName = pinningId ? positions.find(p => p.id === pinningId)?.positionName : null;

  return (
    <section className="map-page glass-panel">
      <div className="map-header">
        <h2>מפת עמדות – אשדוד</h2>
        {pinningId && (
          <div className="pinning-banner">
            מסמנים את <strong>{pinningName}</strong> – לחצי על המפה למיקום הפודטראק
            <button className="ghost pinning-cancel" onClick={() => { setPinningId(null); setCursorCoord(null); }}>ביטול</button>
          </div>
        )}
      </div>
      <div className="map-layout">
        <div className="map-container-wrap">
          <div ref={mapContainer} className="map-3d-container" />
          {pinningId && (
            <div
              className="pinning-overlay"
              onClick={handleOverlayClick}
              onMouseMove={handleOverlayMove}
              onMouseLeave={() => setCursorCoord(null)}
            >
              {cursorCoord && (
                <>
                  <div className="crosshair-v" style={{ left: cursorCoord.px }} />
                  <div className="crosshair-h" style={{ top: cursorCoord.py }} />
                  <div className="coord-tooltip" style={{ left: cursorCoord.px + 14, top: cursorCoord.py - 30 }}>
                    {cursorCoord.lng}, {cursorCoord.lat}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {selected && !pinningId && (
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
            {isPinned(selected.mapPin) && <p className="map-info-coords">📌 {selected.mapPin.x.toFixed(5)}, {selected.mapPin.y.toFixed(5)}</p>}
            <button className="primary map-pin-btn" onClick={() => setPinningId(selected.id)}>📍 סמן מיקום על המפה</button>
          </div>
        )}
      </div>
      <div className="map-legend">
        <span><span className="legend-dot" style={{ background: STATUS_COLORS.green }} /> מקובלת</span>
        <span><span className="legend-dot" style={{ background: STATUS_COLORS.orange }} /> בבדיקה</span>
        <span><span className="legend-dot" style={{ background: STATUS_COLORS.red }} /> לא מקובלת</span>
      </div>
    </section>
  );
}
