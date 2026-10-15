import { useState } from 'react';
import {
  APPROVAL_OPTIONS, BUILDING_OPTIONS, ENV_OPTIONS,
  approvalTone, qualityTone, harmonicaTone, withCurrent,
} from '../utils/colors.js';
import { isPinned } from './PositionCard.jsx';

function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children || '—'}</span>;
}

function InfraCell({ value, onChange, editing }) {
  const good = value === 'טוב';
  if (!editing) return <Pill tone={good ? 'green' : 'red'}>{good ? 'תקין' : 'חסר'}</Pill>;
  return (
    <button
      type="button"
      className={`pill button ${good ? 'green' : 'red'}`}
      onClick={(e) => { e.stopPropagation(); onChange(good ? 'לא טוב' : 'טוב'); }}
    >
      {good ? 'תקין' : 'חסר'}
    </button>
  );
}

function InlineSelect({ value, onChange, options, tone }) {
  return (
    <select
      className={`inline-select tone-${tone(value)}`}
      value={value || ''}
      onClick={e => e.stopPropagation()}
      onChange={e => onChange(e.target.value)}
    >
      {withCurrent(options, value).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function InlineInput({ value, onChange }) {
  return <input className="inline-input" value={value || ''} onClick={e => e.stopPropagation()} onChange={e => onChange(e.target.value)} />;
}

const VALUE_RANK = {
  'טוב': 0, 'לא טוב': 1,
  'מיקום מקובל': 0, 'בבדיקה': 1, 'מיקום לא מקובל': 2,
  'מבנה מקובל': 0, 'יש מבנה': 1, 'מבנה לא מקובל': 2, 'אין מבנה': 3,
  'שמורה': 0, 'טעון שיפור': 1, 'אזהרה': 2,
  'מאושרת': 0, 'הוגשה': 1, 'נדרש תיקון': 2, 'לא הוגשה': 3,
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
  { key: '_pin', label: 'מיקום', sortable: false, group: 'זיהוי' },
  { key: 'complexName', label: 'שם מתחם', group: 'זיהוי' },
  { key: 'positionName', label: 'שם עמדה', group: 'זיהוי' },
  { key: 'businessName', label: 'שם עסק', group: 'עסק' },
  { key: 'ownerName', label: 'שם בעלים', group: 'עסק' },
  { key: 'water', label: 'מים', group: 'תשתיות' },
  { key: 'electricity', label: 'חשמל', group: 'תשתיות' },
  { key: 'sewage', label: 'ביוב', group: 'תשתיות' },
  { key: 'buildingQuality', label: 'עיצוב המבנה', group: 'איכות' },
  { key: 'environmentQuality', label: 'איכות הסביבה', group: 'איכות' },
  { key: 'approval', label: 'סטטוס מיקום', group: 'סטטוס' },
  { key: 'harmonicaStatus', label: 'הרמוניקה', group: 'סטטוס' },
  { key: 'notes', label: 'הערות', group: 'סטטוס' },
];

const COL_GROUPS = COLUMNS.reduce((groups, col) => {
  const last = groups[groups.length - 1];
  if (last && last.name === col.group) last.span++;
  else groups.push({ name: col.group, span: 1 });
  return groups;
}, []);

const FILTER_LABELS = { approved: 'מיקום מקובל', pending: 'בבדיקה', rejected: 'מיקום לא מקובל', all: 'כל העמדות', complexes: 'כל העמדות', harmonica: 'הרמוניקה ממתינה' };

const SEARCH_HISTORY_KEY = 'foode3-search-history';
function loadSearchHistory() {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); } catch { return []; }
}

export default function PositionsTable({
  positions, allPositions, update, changeApproval, add, selectedId, openCard,
  editing, canEdit, statsFilter, onClearFilter, openCorrectionsById,
}) {
  const [sortCol, setSortCol] = useState('number');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState(loadSearchHistory);

  const handleSort = (key) => {
    if (key === sortCol) setSortAsc(!sortAsc);
    else { setSortCol(key); setSortAsc(true); }
  };

  const commitSearch = (term) => {
    const t = term.trim();
    if (!t) return;
    const history = [t, ...searchHistory.filter(h => h !== t)].slice(0, 10);
    setSearchHistory(history);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history)); } catch { /* ignore */ }
  };

  const term = searchTerm.trim().toLowerCase();
  const filtered = !term ? positions : positions.filter(row =>
    [row.number, row.positionName, row.complexName, row.businessName, row.ownerName, row.developerName,
      row.buildingQuality, row.environmentQuality, row.approval, row.harmonicaStatus, row.notes]
      .some(f => String(f || '').toLowerCase().includes(term)));

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[sortCol], b[sortCol]);
    return sortAsc ? cmp : -cmp;
  });

  return (
    <section className="table-shell panel">
      <div className="section-title">
        <div>
          <h2>רשימת עמדות</h2>
          <p>{editing ? 'עריכה ישירה בטבלה. לחיצה על שורה פותחת את כרטיס העמדה.' : 'לחיצה על עמדה, תמונה או מיקום פותחת את כרטיס העמדה.'}</p>
          {statsFilter && (
            <div className="filter-badge">
              מסנן: {FILTER_LABELS[statsFilter]} ({positions.length} מתוך {allPositions.length})
              <button className="text-button" onClick={onClearFilter}>ניקוי</button>
            </div>
          )}
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setSearchOpen(!searchOpen)} aria-expanded={searchOpen}>חיפוש</button>
          {canEdit && <button className="btn primary" onClick={() => openCard(add(), 'details', true)}>הוספת עמדה</button>}
        </div>
      </div>

      {searchOpen && (
        <div className="table-search-bar">
          <input
            className="table-search-input"
            placeholder="חיפוש לפי מילת מפתח"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && commitSearch(searchTerm)}
            autoFocus
          />
          {searchTerm && <span className="table-search-count">{filtered.length} תוצאות</span>}
          <button className="text-button" onClick={() => { setSearchOpen(false); setSearchTerm(''); }}>סגירה</button>
          {searchHistory.length > 0 && !searchTerm && (
            <div className="search-history">
              {searchHistory.map(h => <button key={h} className="search-history-item" onClick={() => setSearchTerm(h)}>{h}</button>)}
            </div>
          )}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr className="col-group-row">
              {COL_GROUPS.map(g => <th key={g.name} colSpan={g.span} className="col-group-header">{g.name}</th>)}
            </tr>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`${col.sortable === false ? '' : 'sortable'} ${sortCol === col.key ? (sortAsc ? 'sorted asc' : 'sorted desc') : ''}`}
                  aria-sort={sortCol === col.key ? (sortAsc ? 'ascending' : 'descending') : undefined}
                  onClick={col.sortable === false ? undefined : () => handleSort(col.key)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => {
              const open = (tab = 'details') => openCard(row.id, tab);
              const corrections = openCorrectionsById[row.id] || 0;
              return (
                <tr
                  key={row.id}
                  className={`${selectedId === row.id ? 'selected' : ''} row-${approvalTone(row.approval)}`}
                  onClick={() => open()}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
                >
                  <td className="mono-cell">{editing ? <InlineInput value={row.number} onChange={v => update(row.id, { number: v })} /> : row.number}</td>
                  <td>
                    {row.foodTruckImageUrl
                      ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} loading="lazy" />
                      : <span className="thumb empty" />}
                  </td>
                  <td>
                    <span className={`pill ${isPinned(row.mapPin) ? 'green' : 'gray'}`}>{isPinned(row.mapPin) ? 'על המפה' : 'לא סומן'}</span>
                  </td>
                  <td>{editing ? <InlineInput value={row.complexName} onChange={v => update(row.id, { complexName: v })} /> : row.complexName}</td>
                  <td className="col-name">{editing ? <InlineInput value={row.positionName} onChange={v => update(row.id, { positionName: v })} /> : <strong>{row.positionName}</strong>}</td>
                  <td>{editing ? <InlineInput value={row.businessName} onChange={v => update(row.id, { businessName: v })} /> : row.businessName || '—'}</td>
                  <td>{editing ? <InlineInput value={row.ownerName} onChange={v => update(row.id, { ownerName: v })} /> : row.ownerName || '—'}</td>
                  <td><InfraCell value={row.water} editing={editing} onChange={v => update(row.id, { water: v })} /></td>
                  <td><InfraCell value={row.electricity} editing={editing} onChange={v => update(row.id, { electricity: v })} /></td>
                  <td><InfraCell value={row.sewage} editing={editing} onChange={v => update(row.id, { sewage: v })} /></td>
                  <td>{editing
                    ? <InlineSelect value={row.buildingQuality} options={BUILDING_OPTIONS} tone={qualityTone} onChange={v => update(row.id, { buildingQuality: v })} />
                    : <Pill tone={qualityTone(row.buildingQuality)}>{row.buildingQuality}</Pill>}</td>
                  <td>{editing
                    ? <InlineSelect value={row.environmentQuality} options={ENV_OPTIONS} tone={qualityTone} onChange={v => update(row.id, { environmentQuality: v })} />
                    : <Pill tone={qualityTone(row.environmentQuality)}>{row.environmentQuality}</Pill>}</td>
                  <td>{editing
                    ? <InlineSelect value={row.approval} options={APPROVAL_OPTIONS} tone={approvalTone} onChange={v => changeApproval(row.id, v)} />
                    : <Pill tone={approvalTone(row.approval)}>{row.approval}</Pill>}</td>
                  <td>
                    <button type="button" className={`pill button ${harmonicaTone(row.harmonicaStatus)}`} onClick={e => { e.stopPropagation(); open('harmonica'); }}>
                      {row.harmonicaStatus || 'לא הוגשה'}{corrections ? ` · ${corrections} הערות` : ''}
                    </button>
                  </td>
                  <td>{editing ? <InlineInput value={row.notes} onChange={v => update(row.id, { notes: v })} /> : <span className="notes-text">{row.notes || '—'}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{filtered.length} עמדות</span></div>
    </section>
  );
}
