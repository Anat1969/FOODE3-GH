import { useEffect, useRef, useState, useCallback } from 'react';
import { approvalTone } from '../utils/colors.js';
import { isPinned } from './PositionCard.jsx';
import maplibregl from 'maplibre-gl';

const ASHDOD_CENTER = [34.6415, 31.8014];
const STATUS_COLORS = { green: '#3fb46a', orange: '#e9b23c', red: '#e5534b', gray: '#9aa0a6' };

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

export default function MapPage({ positions, update, selectedId, openCard, pinningId, setPinningId, onPinned, focusId, canEdit }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [cursorCoord, setCursorCoord] = useState(null);
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
    map.on('load', () => setMapReady(true));
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!pinningId) {
      map.getCanvas().style.cursor = '';
      Object.values(markersRef.current).forEach(({ marker }) => {
        marker.getElement().style.pointerEvents = '';
      });
      return;
    }

    map.getCanvas().style.cursor = 'crosshair';
    Object.values(markersRef.current).forEach(({ marker }) => {
      marker.getElement().style.pointerEvents = 'none';
    });

    const clickHandler = (e) => {
      const id = pinningRef.current;
      update(id, { mapPin: { x: e.lngLat.lng, y: e.lngLat.lat } });
      setPinningId(null);
      setCursorCoord(null);
      onPinned?.(id);
    };

    const moveHandler = (e) => {
      setCursorCoord({
        lng: e.lngLat.lng.toFixed(5),
        lat: e.lngLat.lat.toFixed(5),
        px: e.point.x,
        py: e.point.y,
      });
    };

    map.on('click', clickHandler);
    map.on('mousemove', moveHandler);

    return () => {
      map.off('click', clickHandler);
      map.off('mousemove', moveHandler);
      map.getCanvas().style.cursor = '';
    };
  }, [pinningId, update, setPinningId, onPinned]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const current = new Set(positions.map(p => p.id));

    Object.keys(markersRef.current).forEach(id => {
      if (!current.has(id)) {
        markersRef.current[id].marker.remove();
        delete markersRef.current[id];
      }
    });

    positions.forEach(p => {
      const lng = p.mapPin?.x ?? ASHDOD_CENTER[0];
      const lat = p.mapPin?.y ?? ASHDOD_CENTER[1];
      const color = STATUS_COLORS[approvalTone(p.approval)] || STATUS_COLORS.gray;
      const isSelected = selectedId === p.id;
      const pinned = isPinned(p.mapPin);

      const key = `${p.positionName}|${color}|${isSelected}|${pinned}|${lng}|${lat}`;
      const existing = markersRef.current[p.id];

      if (existing && existing.key === key) return;

      if (existing) {
        existing.marker.remove();
      }

      const el = createMarkerEl(p.positionName, color, isSelected, pinned);
      el.addEventListener('click', (ev) => { ev.stopPropagation(); openCard(p.id); });

      if (pinningRef.current) {
        el.style.pointerEvents = 'none';
      }

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      markersRef.current[p.id] = { marker, key };
    });
  }, [positions, selectedId, mapReady, openCard]);

  // Fly to a position when asked from its card.
  useEffect(() => {
    if (!mapReady || !focusId) return;
    const p = positions.find(x => x.id === focusId);
    if (p && isPinned(p.mapPin)) mapRef.current.flyTo({ center: [p.mapPin.x, p.mapPin.y], zoom: 17, duration: 900 });
  }, [focusId, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const pinningName = pinningId ? positions.find(p => p.id === pinningId)?.positionName : null;

  return (
    <section className="map-page panel">
      <div className="map-header">
        {pinningId && (
          <div className="pinning-banner">
            מסמנים את <strong>{pinningName}</strong>. לחיצה על המפה קובעת את מיקום הפודטראק.
            <button className="btn small" onClick={() => { const id = pinningId; setPinningId(null); setCursorCoord(null); onPinned?.(id); }}>ביטול</button>
          </div>
        )}
      </div>
      <div className="map-layout">
        <div className="map-container-wrap">
          <div ref={mapContainer} className="map-3d-container" />
          {pinningId && cursorCoord && (
            <div className="crosshair-layer">
              <div className="crosshair-v" style={{ left: cursorCoord.px }} />
              <div className="crosshair-h" style={{ top: cursorCoord.py }} />
              <div className="coord-tooltip" style={{ left: cursorCoord.px + 14, top: cursorCoord.py - 30 }}>
                {cursorCoord.lng}, {cursorCoord.lat}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="map-legend">
        <span className="map-hint">לחיצה על סמן פותחת את כרטיס העמדה</span>
        <span><span className="legend-dot" style={{ background: STATUS_COLORS.green }} /> מיקום מקובל</span>
        <span><span className="legend-dot" style={{ background: STATUS_COLORS.orange }} /> בבדיקה</span>
        <span><span className="legend-dot" style={{ background: STATUS_COLORS.red }} /> מיקום לא מקובל</span>
      </div>
    </section>
  );
}
