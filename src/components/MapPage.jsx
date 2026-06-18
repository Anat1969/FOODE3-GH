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

  const selected = positions.find(p => p.id === selectedId);

  return (
    <section className="map-page glass-panel">
      <div className="map-header">
        <h2>מפת עמדות</h2>
        {pinningId && <div className="pinning-banner">לחצי על המפה כדי למקם את העמדה</div>}
      </div>
      <div className="map-layout">
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
    </section>
  );
}
