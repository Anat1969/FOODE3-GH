import { useState, useEffect } from 'react';
import Chip from './Chip.jsx';

const approvalOptions = ['מיקום מקובל', 'בבדיקה', 'מיקום לא מקובל'];
const buildingOptions = ['אין מבנה', 'יש מבנה', 'מבנה לא מקובל', 'מבנה מקובל'];
const envOptions = ['שמורה', 'טעון שיפור', 'אזהרה'];

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
  'מיקום מקובל': 0, 'בבדיקה': 1, 'מיקום לא מקובל': 2,
  'מבנה מקובל': 0, 'יש מבנה': 1, 'מבנה לא מקובל': 2, 'אין מבנה': 3,
  'שמורה': 0, 'טעון שיפור': 1, 'אזהרה': 2,
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
  { key: 'number', label: 'מספר', group: 'זיהוי' },
  { key: 'foodTruckImageUrl', label: 'תמונה', sortable: false, group: 'זיהוי' },
  { key: '_pin', label: 'מפה', sortable: false, group: 'זיהוי' },
  { key: 'complexName', label: 'שם מתחם', group: 'זיהוי' },
  { key: 'positionName', label: 'שם עמדה', group: 'זיהוי' },
  { key: 'businessName', label: 'שם עסק', group: 'פרטי עסק' },
  { key: 'ownerName', label: 'שם בעלים', group: 'פרטי עסק' },
  { key: 'water', label: 'מים', group: 'תשתיות' },
  { key: 'electricity', label: 'חשמל', group: 'תשתיות' },
  { key: 'sewage', label: 'ביוב', group: 'תשתיות' },
  { key: 'buildingQuality', label: 'עיצוב המבנה', group: 'איכות' },
  { key: 'environmentQuality', label: 'איכות הסביבה', group: 'איכות' },
  { key: 'approval', label: 'סטטוס מיקום', group: 'סטטוס' },
  { key: 'notes', label: 'הערות', group: 'סטטוס' },
];

function buildColGroups(columns) {
  const groups = [];
  let current = null;
  for (const col of columns) {
    if (current && current.name === col.group) {
      current.span++;
    } else {
      current = { name: col.group, span: 1 };
      groups.push(current);
    }
  }
  return groups;
}

const COL_GROUPS = buildColGroups(COLUMNS);

const FILTER_LABELS = { approved: 'מיקום מקובל', pending: 'בבדיקה', rejected: 'מיקום לא מקובל', all: 'כל העמדות' };

const SEARCH_HISTORY_KEY = 'foode3-search-history';
function loadSearchHistory() {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveSearchHistory(list) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list.slice(0, 10)));
}

export default function PositionsTable({ positions, allPositions, update, add, remove, selectedId, setSelectedId, setPage, setPinningId, editMode, statsFilter, onClearFilter }) {
  const [sortCol, setSortCol] = useState('number');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState(loadSearchHistory);
  const goPin = (id) => { setSelectedId(id); setPinningId(id); setPage('map'); };

  const handleSort = (key) => {
    if (key === sortCol) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(key);
      setSortAsc(true);
    }
  };

  const commitSearch = (term) => {
    if (!term.trim()) return;
    const history = [term.trim(), ...searchHistory.filter(h => h !== term.trim())].slice(0, 10);
    setSearchHistory(history);
    saveSearchHistory(history);
  };

  const matchesSearch = (row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const fields = [row.number, row.positionName, row.complexName, row.businessName, row.ownerName, row.water, row.electricity, row.sewage, row.buildingQuality, row.environmentQuality, row.approval, row.notes];
    return fields.some(f => (f || '').toLowerCase().includes(term));
  };

  const filtered = positions.filter(matchesSearch);

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[sortCol], b[sortCol]);
    return sortAsc ? cmp : -cmp;
  });

  const approvalClass = (val) => val === 'מיקום מקובל' ? 'green' : val === 'בבדיקה' ? 'orange' : 'red';

  return (
    <section className="table-shell glass-panel">
      <div className="section-title">
        <div>
          <h2>רשימת עמדות</h2>
          <p>{editMode ? 'מצב עריכה – לחצי על שדות לעריכה' : 'מצב תצוגה – לחצי על עמדה לפרטים'}</p>
          {statsFilter && (
            <div className="filter-badge">
              מסנן: {FILTER_LABELS[statsFilter]} ({positions.length} מתוך {allPositions?.length || positions.length})
              <button className="ghost filter-clear" onClick={onClearFilter}>✕ נקה</button>
            </div>
          )}
        </div>
        <div className="actions">
          <button className="search-toggle" onClick={() => setSearchOpen(!searchOpen)} title="חיפוש">
            🔍 חיפוש
          </button>
          {editMode && (
            <>
              <button className="primary" onClick={() => setSelectedId(add())}>+ הוספת עמדה</button>
              <button onClick={() => selectedId && remove(selectedId)}>מחיקה</button>
            </>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="table-search-bar">
          <input
            className="table-search-input"
            placeholder="חיפוש לפי מילת מפתח..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && commitSearch(searchTerm)}
            autoFocus
          />
          {searchTerm && (
            <span className="table-search-count">{filtered.length} תוצאות</span>
          )}
          <button className="ghost" onClick={() => { setSearchOpen(false); setSearchTerm(''); }}>✕</button>
          {searchHistory.length > 0 && !searchTerm && (
            <div className="search-history">
              {searchHistory.map((h, i) => (
                <button key={i} className="search-history-item" onClick={() => setSearchTerm(h)}>{h}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr className="col-group-row">
              {COL_GROUPS.map((g, i) => (
                <th key={i} colSpan={g.span} className="col-group-header">{g.name}</th>
              ))}
            </tr>
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
                <td>
                  {(row.mapPin && (Math.abs(row.mapPin.x - 34.6415) > 0.0001 || Math.abs(row.mapPin.y - 31.8014) > 0.0001))
                    ? <span className="pinned-badge" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📌 נעוץ</span>
                    : <button className="pin-button" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>📍</button>}
                </td>
                <td>{editMode ? <input value={row.complexName} onChange={e => update(row.id, { complexName: e.target.value })} /> : row.complexName}</td>
                <td className="col-name">{editMode ? <input value={row.positionName} onChange={e => update(row.id, { positionName: e.target.value })} /> : <strong>{row.positionName}</strong>}</td>
                <td>{editMode ? <input value={row.businessName} onChange={e => update(row.id, { businessName: e.target.value })} /> : row.businessName}</td>
                <td>{editMode ? <input value={row.ownerName || ''} onChange={e => update(row.id, { ownerName: e.target.value })} /> : row.ownerName || '—'}</td>
                <td><CheckMark value={row.water} editMode={editMode} onChange={v => update(row.id, { water: v })} /></td>
                <td><CheckMark value={row.electricity} editMode={editMode} onChange={v => update(row.id, { electricity: v })} /></td>
                <td><CheckMark value={row.sewage} editMode={editMode} onChange={v => update(row.id, { sewage: v })} /></td>
                <td>
                  {editMode
                    ? <InlineSelect value={row.buildingQuality} options={buildingOptions} onChange={v => update(row.id, { buildingQuality: v })} />
                    : <Chip value={row.buildingQuality} />}
                </td>
                <td>
                  {editMode
                    ? <InlineSelect value={row.environmentQuality} options={envOptions} onChange={v => update(row.id, { environmentQuality: v })} />
                    : <Chip value={row.environmentQuality} />}
                </td>
                <td>
                  {editMode ? (
                    <InlineSelect value={row.approval} options={approvalOptions} type="status" onChange={v => update(row.id, { approval: v, status: v })} />
                  ) : (
                    <span className={`approval-light ${approvalClass(row.approval)}`}>{row.approval}</span>
                  )}
                </td>
                <td>{editMode ? <input value={row.notes || ''} onChange={e => update(row.id, { notes: e.target.value })} /> : <span className="notes-text">{row.notes || '—'}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{filtered.length} עמדות</span></div>
    </section>
  );
}
