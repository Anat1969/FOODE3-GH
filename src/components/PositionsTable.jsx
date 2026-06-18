import Chip from './Chip.jsx';

const qualityOptions = ['טוב', 'לא טוב'];
const approvalOptions = ['מקובלת', 'בבדיקה', 'לא מקובלת'];

function CheckMark({ value, onChange, options }) {
  const isGood = value === options[0];
  return (
    <button
      className={`check-mark ${isGood ? 'good' : 'bad'}`}
      onClick={(e) => { e.stopPropagation(); onChange(isGood ? options[1] : options[0]); }}
    >
      {isGood ? '✓' : '✗'}
    </button>
  );
}

function InlineSelect({ value, onChange, options, type }) {
  return (
    <select className={`inline-select ${type || ''}`} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function PositionsTable({ positions, update, add, remove, selectedId, setSelectedId, setPage, setPinningId }) {
  const goPin = (id) => { setSelectedId(id); setPinningId(id); setPage('map'); };
  const sorted = [...positions].sort((a, b) => Number(a.number) - Number(b.number));
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
              <th>מספר</th><th>תמונה</th><th>שם עמדה</th><th>שם מתחם</th><th>שם עסק</th><th>מים</th><th>חשמל</th><th>ביוב</th><th>איכות מבנה</th><th>איכות הסביבה</th><th>האם מקובלת</th><th>סטטוס</th><th>הערות</th><th>מפה</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className={selectedId === row.id ? 'selected' : ''} onClick={() => setSelectedId(row.id)}>
                <td>{row.number}</td>
                <td>{row.foodTruckImageUrl ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} /> : <span className="thumb empty">—</span>}</td>
                <td><input value={row.positionName} onChange={e => update(row.id, { positionName: e.target.value })} /></td>
                <td><input value={row.complexName} onChange={e => update(row.id, { complexName: e.target.value })} /></td>
                <td><input value={row.businessName} onChange={e => update(row.id, { businessName: e.target.value })} /></td>
                <td><CheckMark value={row.water} options={qualityOptions} onChange={v => update(row.id, { water: v })} /></td>
                <td><CheckMark value={row.electricity} options={qualityOptions} onChange={v => update(row.id, { electricity: v })} /></td>
                <td><CheckMark value={row.sewage} options={qualityOptions} onChange={v => update(row.id, { sewage: v })} /></td>
                <td><Chip value={row.buildingQuality} /></td>
                <td><Chip value={row.environmentQuality} /></td>
                <td><InlineSelect value={row.approval} options={approvalOptions} type="status" onChange={v => update(row.id, { approval: v, status: v })} /></td>
                <td><Chip value={row.status} type="status" /></td>
                <td><input value={row.notes || ''} onChange={e => update(row.id, { notes: e.target.value })} /></td>
                <td><button className="pin-button" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📍</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>1-{positions.length} מתוך {positions.length} עמדות</span></div>
    </section>
  );
}
