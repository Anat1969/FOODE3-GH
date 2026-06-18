const qualityOptions = ['טוב', 'לא טוב'];
const approvalOptions = ['מקובלת', 'בבדיקה', 'לא מקובלת'];
const licenseOptions = ['יש', 'אין'];

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function DetailsPanel({ selected, update, remove, duplicate, goPin }) {
  if (!selected) return <aside className="details glass-panel"><h2>פרטי עמדה</h2><p className="muted">בחרי עמדה לעריכה.</p></aside>;
  const set = (key, value) => update(selected.id, { [key]: value });
  return (
    <aside className="details glass-panel">
      <div className="panel-head"><h2>פרטי עמדה</h2><button className="ghost">×</button></div>
      <div className="foodtruck-photo-card">
        {selected.foodTruckImageUrl ? <img src={selected.foodTruckImageUrl} alt={selected.foodTruckImageAlt || selected.positionName} /> : <div className="photo-placeholder">תמונת פודטראק</div>}
      </div>
      <Field label="קישור לתמונת הפודטראק"><input value={selected.foodTruckImageUrl || ''} onChange={e => set('foodTruckImageUrl', e.target.value)} placeholder="https://..." /></Field>
      <Field label="תיאור תמונה"><input value={selected.foodTruckImageAlt || ''} onChange={e => set('foodTruckImageAlt', e.target.value)} placeholder="לדוגמה: חזית העסק" /></Field>
      <Field label="מספר"><input value={selected.number} onChange={e => set('number', e.target.value)} /></Field>
      <Field label="שם עמדה"><input value={selected.positionName} onChange={e => set('positionName', e.target.value)} /></Field>
      <Field label="שם מתחם"><input value={selected.complexName} onChange={e => set('complexName', e.target.value)} /></Field>
      <Field label="שם עסק"><input value={selected.businessName} onChange={e => set('businessName', e.target.value)} /></Field>
      <div className="two-cols">
        <Field label="מים"><select value={selected.water} onChange={e => set('water', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="חשמל"><select value={selected.electricity} onChange={e => set('electricity', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="ביוב"><select value={selected.sewage} onChange={e => set('sewage', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="רישיון"><select value={selected.businessLicense} onChange={e => set('businessLicense', e.target.value)}>{licenseOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="מבנה"><select value={selected.buildingQuality} onChange={e => set('buildingQuality', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="סביבה"><select value={selected.environmentQuality} onChange={e => set('environmentQuality', e.target.value)}>{qualityOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
      </div>
      <Field label="האם העמדה מקובלת"><select value={selected.approval} onChange={e => update(selected.id, { approval: e.target.value, status: e.target.value })}>{approvalOptions.map(o => <option key={o}>{o}</option>)}</select></Field>
      <Field label="הערות"><textarea value={selected.notes || ''} onChange={e => set('notes', e.target.value)} /></Field>
      <div className="pin-readout">מיקום: {selected.mapPin?.x ?? 0}% / {selected.mapPin?.y ?? 0}%</div>
      <div className="actions stacked">
        <button className="primary" onClick={() => update(selected.id, selected)}>שמירה</button>
        <button onClick={() => goPin(selected.id)}>דקירה על המפה</button>
        <button onClick={() => duplicate(selected.id)}>שכפול</button>
        <button className="danger" onClick={() => remove(selected.id)}>מחיקה</button>
      </div>
    </aside>
  );
}
