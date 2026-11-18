import { useEffect, useRef, useState, useMemo } from 'react';
import { approvalTone } from '../utils/colors.js';
import HoursPanel, { HoursList, useHoursView } from './HoursPanel.jsx';
import { PERMIT, permitState } from '../utils/hours.js';
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

function readView() {
  const q = new URLSearchParams(window.location.search);
  return q.get('view') === 'hours' ? 'hours' : 'approval';
}

export default function MapPage({ positions, update, selectedId, openCard, pinningId, setPinningId, onPinned, focusId, canEdit }) {
  const [view, setViewState] = useState(readView);
  const hours = useHoursView(positions);
  const setView = (v) => {
    setViewState(v);
    const url = new URL(window.location.href);
    if (v === 'hours') url.searchParams.set('view', 'hours'); else { url.searchParams.delete('view'); url.searchParams.delete('h'); }
    window.history.replaceState(null, '', url.pathname + url.search);
  };
  const hoursMode = view === 'hours' && !pinningId;
  const permitById = useMemo(() => Object.fromEntries(positions.map(p => [p.id, permitState(p)])), [positions]);
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
      const color = hoursMode
        ? PERMIT[permitById[p.id]?.tone || 'unknown'].color
        : STATUS_COLORS[approvalTone(p.approval)] || STATUS_COLORS.gray;
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
  }, [positions, selectedId, mapReady, openCard, hoursMode, permitById]);

  // Moving the hour keeps every marker in place and only changes its state, so the change reads as the same stand opening or closing.
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { marker }]) => {
      const el = marker.getElement();
      const open = hoursMode ? hours.openById[id] : undefined;
      el.classList.toggle('hours-open', open === true);
      el.classList.toggle('hours-closed', open === false);
      el.classList.toggle('hours-unknown', hoursMode && open == null);
    });
  }, [hoursMode, hours.openById, positions, mapReady, selectedId]);

  // Fly to a position when asked from its card.
  useEffect(() => {
    if (!mapReady || !focusId) return;
    const p = positions.find(x => x.id === focusId);
    if (p && isPinned(p.mapPin)) mapRef.current.flyTo({ center: [p.mapPin.x, p.mapPin.y], zoom: 17, duration: 900 });
  }, [focusId, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const pinningName = pinningId ? positions.find(p => p.id === pinningId)?.positionName : null;

  return (
    <section className={`map-page panel${hoursMode ? ' map-page-hours' : ''}`}>
      {!pinningId && (
        <div className="map-view-switch segmented large" role="group" aria-label="מה המפה מראה">
          <button className={view === 'approval' ? 'on' : ''} aria-pressed={view === 'approval'} onClick={() => setView('approval')}>אישור מיקום</button>
          <button className={view === 'hours' ? 'on' : ''} aria-pressed={view === 'hours'} onClick={() => setView('hours')}>מפה לפי שעה</button>
        </div>
      )}
      {hoursMode && <HoursPanel positions={positions} hours={hours} permitById={permitById} openCard={openCard} />}
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
      {hoursMode ? (
        <div className="map-legend hours-legend" aria-label="מקרא">
          <span className="mono-label">צבע: תוקף הרישיון</span>
          {['expired', 'soon', 'valid', 'unknown'].map(t => (
            <span key={t}><span className="legend-dot" style={{ background: PERMIT[t].color }} /> {PERMIT[t].label}</span>
          ))}
          <span className="mono-label">סמן: שעות</span>
          <span><span className="legend-mark open" /> פתוחה</span>
          <span><span className="legend-mark closed" /> סגורה</span>
          <span><span className="legend-mark unknown" /> אין שעות רשומות</span>
        </div>
      ) : (
        <div className="map-legend">
          <span><span className="legend-dot" style={{ background: STATUS_COLORS.green }} /> מיקום מקובל</span>
          <span><span className="legend-dot" style={{ background: STATUS_COLORS.orange }} /> בבדיקה</span>
          <span><span className="legend-dot" style={{ background: STATUS_COLORS.red }} /> מיקום לא מקובל</span>
        </div>
      )}
      {hoursMode && <HoursList positions={positions} hours={hours} permitById={permitById} openCard={openCard} />}
    </section>
  );
}
