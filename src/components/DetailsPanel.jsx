const qualityOptions = ['טוב', 'לא טוב'];
const approvalOptions = ['מקובלת', 'בבדיקה', 'לא מקובלת'];

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function CheckField({ label, value, onChange }) {
  const isGood = value === 'טוב';
  return (
    <div className="field">
      <span>{label}</span>
      <button
        type="button"
        className={`check-mark-field ${isGood ? 'good' : 'bad'}`}
        onClick={() => onChange(isGood ? 'לא טוב' : 'טוב')}
      >
        {isGood ? '✓ תקין' : '✗ לא תקין'}
      </button>
    </div>
  );
}

export default function DetailsPanel({ selected, update, remove, duplicate, goPin, onClose }) {
  if (!selected) return <aside className="details glass-panel"><h2>פרטי עמדה</h2><p className="muted">בחרי עמדה לעריכה.</p></aside>;
  const set = (key, value) => update(selected.id, { [key]: value });
  return (
    <aside className="details glass-panel">
      <div className="panel-head"><h2>פרטי עמדה</h2><button className="ghost" onClick={onClose}>×</button></div>
      <div className="foodtruck-photo-card">
        {selected.foodTruckImageUrl ? <img src={selected.foodTruckImageUrl} alt={selected.foodTruckImageAlt || selected.positionName} /> : <div className="photo-placeholder">תמונת פודטראק</div>}
      </div>
      <Field label="קישור לתמונת הפודטראק"><input value={selected.foodTruckImageUrl || ''} onChange={e => set('foodTruckImageUrl', e.target.value)} placeholder="https://..." /></Field>
      <Field label="תיאור תמונה"><input value={selected.foodTruckImageAlt || ''} onChange={e => set('foodTruckImageAlt', e.target.value)} placeholder="לדוגמה: חזית העסק" /></Field>
      <Field label="מספר"><input value={selected.number} onChange={e => set('number', e.target.value)} /></Field>
      <Field label="שם עמדה"><input value={selected.positionName} onChange={e => set('positionName', e.target.value)} /></Field>
      <Field label="שם מתחם"><input value={selected.complexName} onChange={e => set('complexName', e.target.value)} /></Field>
      <Field label="שם עסק"><input value={selected.businessName} onChange={e => set('businessName', e.target.value)} /></Field>
      <div className="three-cols">
        <CheckField label="מים" value={selected.water} onChange={v => set('water', v)} />
        <CheckField label="חשמל" value={selected.electricity} onChange={v => set('electricity', v)} />
        <CheckField label="ביוב" value={selected.sewage} onChange={v => set('sewage', v)} />
      </div>
      <div className="two-cols">
        <Field label="מבנה"><select value={selected.buildingQuality} onChange={e => set('buildingQuality', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="סביבה"><select value={selected.environmentQuality} onChange={e => set('environmentQuality', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
      </div>
      <Field label="האם העמדה מקובלת"><select value={selected.approval} onChange={e => update(selected.id, { approval: e.target.value, status: e.target.value })}>{approvalOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
      <Field label="הערות"><textarea value={selected.notes || ''} onChange={e => set('notes', e.target.value)} /></Field>
      <div className="pin-readout">מיקום: {selected.mapPin?.x ?? 0}% / {selected.mapPin?.y ?? 0}%</div>
      <div className="actions stacked">
        <button className="primary" onClick={() => goPin(selected.id)}>📍 דקירה על המפה</button>
        <button onClick={() => duplicate(selected.id)}>שכפול</button>
        <button className="danger" onClick={() => { remove(selected.id); onClose(); }}>מחיקה</button>
      </div>
    </aside>
  );
}
