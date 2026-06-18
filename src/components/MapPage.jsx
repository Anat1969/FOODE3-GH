import { statusColor } from '../utils/colors.js';

export default function MapPage({ positions, update, selectedId, setSelectedId, pinningId, setPinningId }) {
  const handleMapClick = (e) => {
    if (!pinningId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    update(pinningId, { mapPin: { x, y } });
    setPinningId(null);
  };

  return (
    <section className="map-page glass-panel">
      <h2>מפת עמדות</h2>
      {pinningId && <div className="pinning-banner">לחצי על המפה כדי למקם את העמדה</div>}
      <div className="map-container" onClick={handleMapClick}>
        <div className="map-bg" />
        {positions.map(p => (
          <button
            key={p.id}
            className={`map-pin ${statusColor(p.approval)} ${selectedId === p.id ? 'selected' : ''}`}
            style={{ left: `${p.mapPin?.x ?? 50}%`, top: `${p.mapPin?.y ?? 50}%` }}
            onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); }}
            title={`${p.number} – ${p.positionName}`}
          >
            📍
          </button>
        ))}
      </div>
    </section>
  );
}
