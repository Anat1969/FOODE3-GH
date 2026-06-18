import Chip from './Chip.jsx';

const qualityOptions = ['טוב', 'לא טוב'];
const approvalOptions = ['מקובלת', 'בבדיקה', 'לא מקובלת'];

function InlineSelect({ value, onChange, options, type }) {
  return (
    <select className={`inline-select ${type || ''}`} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function PositionsTable({ positions, update, add, remove, selectedId, setSelectedId, setPage, setPinningId }) {
  const goPin = (id) => { setSelectedId(id); setPinningId(id); setPage('map'); };
  return (
    <section className="table-shell glass-panel">
      <div className="section-title">
        <div><h2>רשימת עמדות</h2><p>עריכה בזמן אמת של מיקומי הפודטראקים, תשתיות וסטטוס אישור.</p></div>
        <div className="actions"><button className="primary" onClick={() => setSelectedId(add())}>+ הוספת עמדה</button><button onClick={() => selectedId && remove(selectedId)}>מחיקה</button></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>מספר</th><th>תמונה</th><th>שם עמדה</th><th>שם מתחם</th><th>מים</th><th>חשמל</th><th>ביוב</th><th>רישיון עסק</th><th>שם עסק</th><th>תנועה</th><th>אשפה</th><th>נגישות</th><th>תאורה</th><th>איכות מבנה</th><th>איכות הסביבה</th><th>האם מקובלת</th><th>סטטוס</th><th>הערות</th><th>דקירה על המפה</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(row => (
              <tr key={row.id} className={selectedId === row.id ? 'selected' : ''} onClick={() => setSelectedId(row.id)}>
                <td>{row.number}</td>
                <td>{row.foodTruckImageUrl ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} /> : <span className="thumb empty">—</span>}</td>
                <td><input value={row.positionName} onChange={e => update(row.id, { positionName: e.target.value })} /></td>
                <td><input value={row.complexName} onChange={e => update(row.id, { complexName: e.target.value })} /></td>
                <td><InlineSelect value={row.water} options={qualityOptions} onChange={v => update(row.id, { water: v })} /></td>
                <td><InlineSelect value={row.electricity} options={qualityOptions} onChange={v => update(row.id, { electricity: v })} /></td>
                <td><InlineSelect value={row.sewage} options={qualityOptions} onChange={v => update(row.id, { sewage: v })} /></td>
                <td><InlineSelect value={row.businessLicense} options={['יש','אין']} onChange={v => update(row.id, { businessLicense: v })} /></td>
                <td><input value={row.businessName} onChange={e => update(row.id, { businessName: e.target.value })} /></td>
                <td><InlineSelect value={row.traffic} options={qualityOptions} onChange={v => update(row.id, { traffic: v })} /></td>
                <td><InlineSelect value={row.waste} options={qualityOptions} onChange={v => update(row.id, { waste: v })} /></td>
                <td><InlineSelect value={row.accessibility} options={qualityOptions} onChange={v => update(row.id, { accessibility: v })} /></td>
                <td><InlineSelect value={row.lighting} options={qualityOptions} onChange={v => update(row.id, { lighting: v })} /></td>
                <td><Chip value={row.buildingQuality} /></td>
                <td><Chip value={row.environmentQuality} /></td>
                <td><InlineSelect value={row.approval} options={approvalOptions} type="status" onChange={v => update(row.id, { approval: v, status: v })} /></td>
                <td><Chip value={row.status} type="status" /></td>
                <td><input value={row.notes || ''} onChange={e => update(row.id, { notes: e.target.value })} /></td>
                <td><button className="pin-button" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📍 דקור</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>1-{positions.length} מתוך {positions.length} עמדות</span><strong>1</strong><span>2</span><span>3</span></div>
    </section>
  );
}
