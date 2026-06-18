import ImageUpload from './ImageUpload.jsx';

const qualityOptions = ['טוב', 'לא טוב'];
const approvalOptions = ['מקובלת', 'בבדיקה', 'לא מקובלת'];

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function CheckField({ label, value, onChange, editMode }) {
  const isGood = value === 'טוב';
  if (!editMode) {
    return (
      <div className="field">
        <span>{label}</span>
        <span className={`check-mark-field-view ${isGood ? 'good' : 'bad'}`}>{isGood ? '✓ תקין' : '✗ לא תקין'}</span>
      </div>
    );
  }
  return (
    <div className="field">
      <span>{label}</span>
      <button type="button" className={`check-mark-field ${isGood ? 'good' : 'bad'}`} onClick={() => onChange(isGood ? 'לא טוב' : 'טוב')}>
        {isGood ? '✓ תקין' : '✗ לא תקין'}
      </button>
    </div>
  );
}

export default function DetailsPanel({ selected, update, remove, duplicate, goPin, onClose, editMode }) {
  if (!selected) return <aside className="details glass-panel"><h2>פרטי עמדה</h2><p className="muted">בחרי עמדה לצפייה.</p></aside>;
  const set = (key, value) => update(selected.id, { [key]: value });

  return (
    <aside className="details glass-panel">
      <div className="panel-head"><h2>פרטי עמדה</h2><button className="ghost" onClick={onClose}>×</button></div>

      {editMode ? (
        <ImageUpload value={selected.foodTruckImageUrl} onChange={v => set('foodTruckImageUrl', v)} alt={selected.foodTruckImageAlt || selected.positionName} />
      ) : (
        <div className="foodtruck-photo-card">
          {selected.foodTruckImageUrl ? <img src={selected.foodTruckImageUrl} alt={selected.foodTruckImageAlt || selected.positionName} /> : <div className="photo-placeholder">תמונת פודטראק</div>}
        </div>
      )}

      {editMode ? (
        <>
          <Field label="תיאור תמונה"><input value={selected.foodTruckImageAlt || ''} onChange={e => set('foodTruckImageAlt', e.target.value)} placeholder="לדוגמה: חזית העסק" /></Field>
          <Field label="מספר"><input value={selected.number} onChange={e => set('number', e.target.value)} /></Field>
          <Field label="שם עמדה"><input value={selected.positionName} onChange={e => set('positionName', e.target.value)} /></Field>
          <Field label="שם מתחם"><input value={selected.complexName} onChange={e => set('complexName', e.target.value)} /></Field>
          <Field label="שם עסק"><input value={selected.businessName} onChange={e => set('businessName', e.target.value)} /></Field>
        </>
      ) : (
        <div className="view-fields">
          <div className="view-field"><span>מספר</span><strong>{selected.number}</strong></div>
          <div className="view-field"><span>שם עמדה</span><strong>{selected.positionName}</strong></div>
          <div className="view-field"><span>שם מתחם</span><strong>{selected.complexName}</strong></div>
          <div className="view-field"><span>שם עסק</span><strong>{selected.businessName}</strong></div>
        </div>
      )}

      <div className="three-cols">
        <CheckField label="מים" value={selected.water} editMode={editMode} onChange={v => set('water', v)} />
        <CheckField label="חשמל" value={selected.electricity} editMode={editMode} onChange={v => set('electricity', v)} />
        <CheckField label="ביוב" value={selected.sewage} editMode={editMode} onChange={v => set('sewage', v)} />
      </div>

      {editMode ? (
        <div className="two-cols">
          <Field label="מבנה"><select value={selected.buildingQuality} onChange={e => set('buildingQuality', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
          <Field label="סביבה"><select value={selected.environmentQuality} onChange={e => set('environmentQuality', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        </div>
      ) : (
        <div className="two-cols">
          <div className="field"><span>מבנה</span><span className={`check-mark-field-view ${selected.buildingQuality === 'טוב' ? 'good' : 'bad'}`}>{selected.buildingQuality}</span></div>
          <div className="field"><span>סביבה</span><span className={`check-mark-field-view ${selected.environmentQuality === 'טוב' ? 'good' : 'bad'}`}>{selected.environmentQuality}</span></div>
        </div>
      )}

      {editMode ? (
        <Field label="האם העמדה מקובלת"><select value={selected.approval} onChange={e => update(selected.id, { approval: e.target.value, status: e.target.value })}>{approvalOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
      ) : (
        <div className="field"><span>האם מקובלת</span><span className={`chip ${selected.approval === 'מקובלת' ? 'green' : selected.approval === 'בבדיקה' ? 'orange' : 'red'}`}>{selected.approval}</span></div>
      )}

      {editMode ? (
        <Field label="הערות"><textarea value={selected.notes || ''} onChange={e => set('notes', e.target.value)} /></Field>
      ) : (
        selected.notes && <div className="field"><span>הערות</span><p className="view-notes">{selected.notes}</p></div>
      )}

      <div className="pin-readout">מיקום: {selected.mapPin?.x ?? 0}% / {selected.mapPin?.y ?? 0}%</div>

      <div className="actions stacked">
        <button className="primary" onClick={() => goPin(selected.id)}>📍 דקירה על המפה</button>
        {editMode && <button className="danger" onClick={() => { remove(selected.id); onClose(); }}>מחיקה</button>}
      </div>
    </aside>
  );
}
