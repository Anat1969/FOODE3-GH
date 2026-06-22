import { useState } from 'react';
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

const VALUE_RANK = {
  'טוב': 0, 'לא טוב': 1,
  'יש': 0, 'אין': 1,
  'מקובלת': 0, 'בבדיקה': 1, 'לא מקובלת': 2,
};

function compareValues(a, b) {
  const ra = VALUE_RANK[a];
  const rb = VALUE_RANK[b];
  if (ra !== undefined && rb !== undefined) return ra - rb;
  const na = Number(a);
  const nb = Number(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a || '').localeCompare(String(b || ''), 'he');
}

const COLUMNS = [
  { key: 'number', label: 'מספר' },
  { key: 'foodTruckImageUrl', label: 'תמונה', sortable: false },
  { key: 'positionName', label: 'שם עמדה' },
  { key: 'approval', label: 'האם מקובלת' },
  { key: 'complexName', label: 'שם מתחם' },
  { key: 'businessName', label: 'שם עסק' },
  { key: 'water', label: 'מים' },
  { key: 'electricity', label: 'חשמל' },
  { key: 'sewage', label: 'ביוב' },
  { key: 'buildingQuality', label: 'איכות מבנה' },
  { key: 'environmentQuality', label: 'איכות הסביבה' },
  { key: 'notes', label: 'הערות' },
  { key: '_pin', label: 'מפה', sortable: false },
];

export default function PositionsTable({ positions, update, add, remove, selectedId, setSelectedId, setPage, setPinningId, editMode }) {
  const [sortCol, setSortCol] = useState('approval');
  const [sortAsc, setSortAsc] = useState(true);
  const goPin = (id) => { setSelectedId(id); setPinningId(id); setPage('map'); };

  const handleSort = (key) => {
    if (key === sortCol) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(key);
      setSortAsc(true);
    }
  };

  const sorted = [...positions].sort((a, b) => {
    const cmp = compareValues(a[sortCol], b[sortCol]);
    return sortAsc ? cmp : -cmp;
  });

  const approvalClass = (val) => val === 'מקובלת' ? 'green' : val === 'בבדיקה' ? 'orange' : 'red';

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
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={col.sortable === false ? '' : 'sortable'}
                  onClick={col.sortable === false ? undefined : () => handleSort(col.key)}
                >
                  {col.label}
                  {sortCol === col.key && <span className="sort-arrow">{sortAsc ? ' ▲' : ' ▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.id} className={`${selectedId === row.id ? 'selected' : ''} approval-${approvalClass(row.approval)}`} onClick={() => setSelectedId(row.id)}>
                <td>{row.number}</td>
                <td>{row.foodTruckImageUrl ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} /> : <span className="thumb empty">—</span>}</td>
                <td className="col-name">{editMode ? <input value={row.positionName} onChange={e => update(row.id, { positionName: e.target.value })} /> : <strong>{row.positionName}</strong>}</td>
                <td>
                  {editMode ? (
                    <InlineSelect value={row.approval} options={approvalOptions} type="status" onChange={v => update(row.id, { approval: v, status: v })} />
                  ) : (
                    <span className={`approval-light ${approvalClass(row.approval)}`}>{row.approval}</span>
                  )}
                </td>
                <td>{editMode ? <input value={row.complexName} onChange={e => update(row.id, { complexName: e.target.value })} /> : row.complexName}</td>
                <td>{editMode ? <input value={row.businessName} onChange={e => update(row.id, { businessName: e.target.value })} /> : row.businessName}</td>
                <td><CheckMark value={row.water} editMode={editMode} onChange={v => update(row.id, { water: v })} /></td>
                <td><CheckMark value={row.electricity} editMode={editMode} onChange={v => update(row.id, { electricity: v })} /></td>
                <td><CheckMark value={row.sewage} editMode={editMode} onChange={v => update(row.id, { sewage: v })} /></td>
                <td><Chip value={row.buildingQuality} /></td>
                <td><Chip value={row.environmentQuality} /></td>
                <td>{editMode ? <input value={row.notes || ''} onChange={e => update(row.id, { notes: e.target.value })} /> : <span className="notes-text">{row.notes || '—'}</span>}</td>
                <td>
                  {(row.mapPin && (Math.abs(row.mapPin.x - 34.6415) > 0.0001 || Math.abs(row.mapPin.y - 31.8014) > 0.0001))
                    ? <span className="pinned-badge" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📌 נעוץ</span>
                    : <button className="pin-button" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📍</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{positions.length} עמדות</span></div>
    </section>
  );
}
