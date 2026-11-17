import ImageUpload from './ImageUpload.jsx';
import Chip from './Chip.jsx';
import { statusColor } from '../utils/colors.js';

export const QUALITY_OPTIONS = ['טוב', 'לא טוב', 'טעון שיפור', 'אזהרה', 'יש מבנה', 'מבנה לא מקובל'];
const APPROVAL_OPTIONS = ['מיקום מקובל', 'בבדיקה', 'מיקום לא מקובל'];
const fmt = (d) => (d ? d.split('-').reverse().join('.') : '—');
const isPinned = (p) => p && (Math.abs(p.x - 34.6415) > 0.0001 || Math.abs(p.y - 31.8014) > 0.0001);

function CheckTile({ label, value, editMode, onChange }) {
  const good = value === 'טוב';
  const inner = (
    <>
      <small>{label}</small>
      <b className={`pv ${good ? 'good' : 'bad'}`}>{good ? '✓' : '✗'}</b>
      <em>{good ? 'תקין' : 'לא תקין'}</em>
    </>
  );
  return editMode
    ? <button className="ptile infra editable" onClick={() => onChange(good ? 'לא טוב' : 'טוב')} title="לחיצה להחלפה">{inner}</button>
    : <div className="ptile infra">{inner}</div>;
}

function QualityTile({ label, value, editMode, onChange }) {
  const opts = QUALITY_OPTIONS.includes(value) ? QUALITY_OPTIONS : [value, ...QUALITY_OPTIONS];
  return (
    <div className="ptile quality">
      <small>{label}</small>
      {editMode
        ? <select value={value} onChange={e => onChange(e.target.value)}>{opts.map(o => <option key={o}>{o}</option>)}</select>
        : <b className="pq"><Chip value={value} /></b>}
    </div>
  );
}

export default function PositionCard({ position: p, trucks = [], update, remove, duplicate, onPin, onClose, editMode, setPage }) {
  if (!p) {
    return (
      <aside className="pcard glass-panel pcard-empty">
        <h3>כרטיס עמדה</h3>
        <p>בחרי עמדה ברשימה או סימן במפה, והכרטיס יציג כאן את העמדה, התשתיות, האיכות והפודטראק.</p>
      </aside>
    );
  }
  const set = (k, v) => update(p.id, { [k]: v });
  const linked = trucks.filter(t => t.positionId === p.id);

  return (
    <aside className="pcard glass-panel">
      <div className="pcard-head">
        <div>
          <small>עמדה {p.number} · {p.complexName || 'ללא מתחם'}</small>
          {editMode
            ? <input className="pcard-name-input" value={p.positionName} onChange={e => set('positionName', e.target.value)} />
            : <h3>{p.positionName}</h3>}
        </div>
        {onClose && <button className="ghost" onClick={onClose}>סגירה</button>}
      </div>

      <div className="pcard-status">
        {editMode
          ? <select value={p.approval} onChange={e => update(p.id, { approval: e.target.value, status: e.target.value })}>{APPROVAL_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
          : <span className={`chip big ${statusColor(p.approval)}`}>{p.approval}</span>}
        {isPinned(p.mapPin) && !editMode && <span className="pinned-badge inline">נעוץ על המפה</span>}
      </div>

      <div className="pcard-photo">
        {editMode
          ? <ImageUpload value={p.foodTruckImageUrl} onChange={v => set('foodTruckImageUrl', v)} alt={p.foodTruckImageAlt || p.positionName} />
          : p.foodTruckImageUrl
            ? <img src={p.foodTruckImageUrl} alt={p.foodTruckImageAlt || p.positionName} />
            : <div className="photo-placeholder">אין תמונת פודטראק</div>}
      </div>

      {editMode && (
        <div className="pcard-edit">
          <label><span>מספר</span><input value={p.number} onChange={e => set('number', e.target.value)} /></label>
          <label><span>מתחם</span><input value={p.complexName} onChange={e => set('complexName', e.target.value)} /></label>
          <label><span>שם עסק</span><input value={p.businessName} onChange={e => set('businessName', e.target.value)} /></label>
          <label><span>תיאור תמונה</span><input value={p.foodTruckImageAlt || ''} onChange={e => set('foodTruckImageAlt', e.target.value)} /></label>
        </div>
      )}

      <div className="pgroup infra">
        <h4>תשתיות</h4>
        <div className="ptiles three">
          <CheckTile label="מים" value={p.water} editMode={editMode} onChange={v => set('water', v)} />
          <CheckTile label="חשמל" value={p.electricity} editMode={editMode} onChange={v => set('electricity', v)} />
          <CheckTile label="ביוב" value={p.sewage} editMode={editMode} onChange={v => set('sewage', v)} />
        </div>
      </div>
      <div className="pgroup quality">
        <h4>איכות</h4>
        <div className="ptiles two">
          <QualityTile label="מבנה" value={p.buildingQuality} editMode={editMode} onChange={v => set('buildingQuality', v)} />
          <QualityTile label="סביבה" value={p.environmentQuality} editMode={editMode} onChange={v => set('environmentQuality', v)} />
        </div>
      </div>

      <div className="pgroup truck">
        <h4>הפודטראק</h4>
        {p.businessName && <p className="pbiz">{p.businessName}</p>}
        {linked.length === 0 && !p.businessName && <p className="muted">לא משויך פודטראק. אפשר לשייך בדף "פודטראקים".</p>}
        {linked.map(t => (
          <div className="ptruck" key={t.id}>
            <strong>{t.ownerName}{t.businessLabel ? ` · ${t.businessLabel}` : ''}</strong>
            <span>{t.ownerType} · <a href={`tel:${t.phone}`}>{t.phone}</a></span>
            <span>הסכם עד <b>{fmt(t.endDate)}</b> · אופציה עד {fmt(t.optionUntil)}</span>
            {t.status && <span className="muted">{t.status}</span>}
          </div>
        ))}
        {setPage && linked.length > 0 && <button className="linkish" onClick={() => setPage('trucks')}>לעריכת ההסכם בדף הפודטראקים</button>}
      </div>

      {(editMode || p.notes) && (
        <div className="pgroup notes">
          <h4>הערות</h4>
          {editMode ? <textarea rows={2} value={p.notes || ''} onChange={e => set('notes', e.target.value)} /> : <p>{p.notes}</p>}
        </div>
      )}

      <div className="pcard-actions">
        <button className="primary" onClick={() => onPin(p.id)}>{isPinned(p.mapPin) ? 'שינוי מיקום במפה' : 'סימון מיקום במפה'}</button>
        {editMode && duplicate && <button onClick={() => duplicate(p.id)}>שכפול</button>}
        {editMode && remove && <button className="danger" onClick={() => { remove(p.id); onClose && onClose(); }}>מחיקה</button>}
      </div>
    </aside>
  );
}
