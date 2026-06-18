import Chip from './Chip.jsx';

const approvalOptions = ['מקובלת', 'בבדיקה', 'לא מקובלת'];

function CheckMark({ value, onChange, editMode }) {
  const isGood = value === 'טוב';
  if (!editMode) {
    return <span className={`check-mark-view ${isGood ? 'good' : 'bad'}`}>{isGood ? '✓' : '✗'}</span>;
  }
  return (
    <button
      className={`check-mark ${isGood ? 'good' : 'bad'}`}
      onClick={(e) => { e.stopPropagation(); onChange(isGood ? 'לא טוב' : 'טוב'); }}
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

const SORT_PRIORITY = {
  'טוב': 0, 'לא טוב': 1,
  'יש': 0, 'אין': 1,
  'מקובלת': 0, 'בבדיקה': 1, 'לא מקובלת': 2,
};

export default function PositionsTable({ positions, update, add, remove, selectedId, setSelectedId, setPage, setPinningId, editMode }) {
  const goPin = (id) => { setSelectedId(id); setPinningId(id); setPage('map'); };
  const sorted = [...positions].sort((a, b) => {
    const pa = SORT_PRIORITY[a.approval] ?? 1;
    const pb = SORT_PRIORITY[b.approval] ?? 1;
    if (pa !== pb) return pa - pb;
    return Number(a.number) - Number(b.number);
  });

  return (
    <section className="table-shell glass-panel">
      <div className="section-title">
        <div><h2>רשימת עמדות</h2><p>{editMode ? 'מצב עריכה – לחצי על שדות לעריכה' : 'מצב תצוגה – לחצי על עמדה לפרטים'}</p></div>
        {editMode && (
          <div className="actions">
            <button className="primary" onClick={() => setSelectedId(add())}>+ הוספת עמדה</button>
            <button onClick={() => selectedId && remove(selectedId)}>מחיקה</button>
          </div>
        )}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>מספר</th><th>תמונה</th><th>שם עמדה</th><th>שם מתחם</th><th>שם עסק</th><th>מים</th><th>חשמל</th><th>ביוב</th><th>איכות מבנה</th><th>איכות הסביבה</th><th>האם מקובלת</th><th>הערות</th><th>מפה</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className={`${selectedId === row.id ? 'selected' : ''} approval-${row.approval === 'מקובלת' ? 'green' : row.approval === 'בבדיקה' ? 'orange' : 'red'}`} onClick={() => setSelectedId(row.id)}>
                <td>{row.number}</td>
                <td>{row.foodTruckImageUrl ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} /> : <span className="thumb empty">—</span>}</td>
                <td>{editMode ? <input value={row.positionName} onChange={e => update(row.id, { positionName: e.target.value })} /> : row.positionName}</td>
                <td>{editMode ? <input value={row.complexName} onChange={e => update(row.id, { complexName: e.target.value })} /> : row.complexName}</td>
                <td>{editMode ? <input value={row.businessName} onChange={e => update(row.id, { businessName: e.target.value })} /> : row.businessName}</td>
                <td><CheckMark value={row.water} editMode={editMode} onChange={v => update(row.id, { water: v })} /></td>
                <td><CheckMark value={row.electricity} editMode={editMode} onChange={v => update(row.id, { electricity: v })} /></td>
                <td><CheckMark value={row.sewage} editMode={editMode} onChange={v => update(row.id, { sewage: v })} /></td>
                <td><Chip value={row.buildingQuality} /></td>
                <td><Chip value={row.environmentQuality} /></td>
                <td>{editMode ? <InlineSelect value={row.approval} options={approvalOptions} type="status" onChange={v => update(row.id, { approval: v, status: v })} /> : <Chip value={row.approval} type="status" />}</td>
                <td>{editMode ? <input value={row.notes || ''} onChange={e => update(row.id, { notes: e.target.value })} /> : <span className="notes-text">{row.notes || '—'}</span>}</td>
                <td><button className="pin-button" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📍</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{positions.length} עמדות</span></div>
    </section>
  );
}
