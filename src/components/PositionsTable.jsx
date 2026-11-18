import { useState, Fragment } from 'react';
import {
  APPROVAL_OPTIONS, BUILDING_OPTIONS, ENV_OPTIONS,
  approvalTone, qualityTone, harmonicaTone, withCurrent,
} from '../utils/colors.js';
import { isPinned } from './PositionCard.jsx';

function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children || '—'}</span>;
}

const stop = e => e.stopPropagation();

function InfraCell({ value, onChange, canEdit }) {
  const good = value === 'טוב';
  if (!canEdit) return <Pill tone={good ? 'green' : 'red'}>{good ? 'תקין' : 'חסר'}</Pill>;
  return (
    <button
      type="button"
      className={`pill button toggle ${good ? 'green' : 'red'}`}
      title="לחיצה מחליפה בין תקין לחסר"
      onClick={(e) => { stop(e); onChange(good ? 'לא טוב' : 'טוב'); }}
    >
      {good ? 'תקין' : 'חסר'}
    </button>
  );
}

function SelectCell({ value, onChange, options, tone, canEdit }) {
  if (!canEdit) return <Pill tone={tone(value)}>{value}</Pill>;
  return (
    <select className={`pill-select tone-${tone(value)}`} value={value || ''} onClick={stop} onChange={e => onChange(e.target.value)}>
      {withCurrent(options, value).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// Text cell: plain text for viewers, an in-place input for editors (does not open the card).
function TextCell({ value, onChange, canEdit, strong, className = '' }) {
  if (!canEdit) return strong ? <strong>{value || '—'}</strong> : <span className={className}>{value || '—'}</span>;
  return (
    <input
      className={`cell-input ${strong ? 'strong' : ''} ${className}`}
      value={value || ''}
      placeholder="—"
      onClick={stop}
      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }}
      onChange={e => onChange(e.target.value)}
    />
  );
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
  if (a !== '' && b !== '' && !isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a || '').localeCompare(String(b || ''), 'he');
}

// group: topic band; groupBy: sorting by this column frames rows into groups
const COLUMNS = [
  { key: 'number', label: 'מספר', group: 'זיהוי' },
  { key: 'foodTruckImageUrl', label: 'תמונה', sortable: false, group: 'זיהוי' },
  { key: '_pin', label: 'מיקום', sortable: false, group: 'זיהוי' },
  { key: 'complexName', label: 'שם מתחם', group: 'זיהוי', groupBy: true },
  { key: 'positionName', label: 'שם עמדה', group: 'זיהוי' },
  { key: 'businessName', label: 'שם עסק', group: 'עסק', groupBy: true },
  { key: 'ownerName', label: 'שם בעלים', group: 'עסק', groupBy: true },
  { key: 'water', label: 'מים', group: 'תשתיות', groupBy: true, infra: true },
  { key: 'electricity', label: 'חשמל', group: 'תשתיות', groupBy: true, infra: true },
  { key: 'sewage', label: 'ביוב', group: 'תשתיות', groupBy: true, infra: true },
  { key: 'buildingQuality', label: 'עיצוב המבנה', group: 'איכות', groupBy: true },
  { key: 'environmentQuality', label: 'איכות הסביבה', group: 'איכות', groupBy: true },
  { key: 'approval', label: 'סטטוס מיקום', group: 'סטטוס', groupBy: true },
  { key: 'harmonicaStatus', label: 'הרמוניקה', group: 'סטטוס', groupBy: true },
  { key: 'notes', label: 'הערות', group: 'סטטוס' },
];

// First column of each topic band gets a soft divider.
COLUMNS.forEach((c, i) => { c.bandStart = i > 0 && COLUMNS[i - 1].group !== c.group; });

const COL_GROUPS = COLUMNS.reduce((groups, col) => {
  const last = groups[groups.length - 1];
  if (last && last.name === col.group) last.span++;
  else groups.push({ name: col.group, span: 1, bandStart: col.bandStart });
  return groups;
}, []);

const INFRA_LABEL = { 'טוב': 'תקין', 'לא טוב': 'חסר' };

const FILTER_LABELS = { approved: 'מיקום מקובל', pending: 'בבדיקה', rejected: 'מיקום לא מקובל', all: 'כל העמדות', complexes: 'כל העמדות', harmonica: 'הרמוניקה ממתינה' };

export default function PositionsTable({
  positions, allPositions, update, changeApproval, add, selectedId, openCard,
  canEdit, statsFilter, onClearFilter, openCorrectionsById,
}) {
  const [sortCol, setSortCol] = useState('number');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key) => {
    if (key === sortCol) setSortAsc(!sortAsc);
    else { setSortCol(key); setSortAsc(true); }
  };

  const term = searchTerm.trim().toLowerCase();
  const filtered = !term ? positions : positions.filter(row =>
    [row.number, row.positionName, row.complexName, row.businessName, row.ownerName, row.developerName,
      row.buildingQuality, row.environmentQuality, row.approval, row.harmonicaStatus, row.notes]
      .some(f => String(f || '').toLowerCase().includes(term)));

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[sortCol], b[sortCol]) || compareValues(a.number, b.number);
    return sortAsc ? cmp : -cmp;
  });

  const sortColumn = COLUMNS.find(c => c.key === sortCol);
  const groups = [];
  if (sortColumn?.groupBy) {
    for (const row of sorted) {
      const raw = row[sortCol] || '';
      const label = sortColumn.infra ? INFRA_LABEL[raw] || raw : raw || 'ללא';
      const last = groups[groups.length - 1];
      if (last && last.key === raw) last.rows.push(row);
      else groups.push({ key: raw, label, rows: [row] });
    }
  } else {
    groups.push({ key: '_all', label: null, rows: sorted });
  }

  return (
    <section className="table-shell panel">
      <div className="section-title">
        <div>
          <h2>רשימת עמדות</h2>
          {statsFilter && (
            <div className="filter-badge">
              מסנן: {FILTER_LABELS[statsFilter] || statsFilter.replace('complex:', 'מתחם ')} ({positions.length} מתוך {allPositions.length})
              <button className="text-button" onClick={onClearFilter}>ניקוי</button>
            </div>
          )}
        </div>
        <div className="actions">
          <div className="search-box">
            <input
              type="search"
              className="table-search-input"
              placeholder="חיפוש בכל השדות"
              aria-label="חיפוש"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {term && <span className="table-search-count">{filtered.length} תוצאות</span>}
          </div>
          {canEdit && <button className="icon-btn add large" aria-label="הוספת עמדה" title="הוספת עמדה" onClick={() => openCard(add(), 'details')}>+</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table className={groups.length > 1 ? 'grouped' : ''}>
          <thead>
            <tr className="col-group-row">
              {COL_GROUPS.map(g => <th key={g.name} colSpan={g.span} className={`col-group-header ${g.bandStart ? 'band-start' : ''}`}>{g.name}</th>)}
            </tr>
            <tr>
              {COLUMNS.map(col => {
                const sorted = sortCol === col.key;
                const sortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    className={`${col.bandStart ? 'band-start' : ''} ${sorted ? 'sorted' : ''}`}
                    aria-sort={sorted ? (sortAsc ? 'ascending' : 'descending') : undefined}
                  >
                    {sortable ? (
                      <button type="button" className="sort-button" onClick={() => handleSort(col.key)} title="מיון לפי עמודה זו">
                        {col.label}
                        <span className="sort-arrow" aria-hidden="true">{sorted ? (sortAsc ? '↑' : '↓') : '↕'}</span>
                      </button>
                    ) : col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          {groups.map(group => (
            <Fragment key={group.key}>
              <tbody className={group.label !== null ? 'row-group' : ''}>
                {group.label !== null && (
                  <tr className="group-head">
                    <td colSpan={COLUMNS.length}>
                      <span className="group-name">{group.label}</span>
                      <span className="mono-label">{group.rows.length} עמדות</span>
                    </td>
                  </tr>
                )}
                {group.rows.map(row => {
                  const open = (tab = 'details') => openCard(row.id, tab);
                  const corrections = openCorrectionsById[row.id] || 0;
                  const b = (key) => (COLUMNS.find(c => c.key === key).bandStart ? 'band-start' : '');
                  return (
                    <tr
                      key={row.id}
                      className={`${selectedId === row.id ? 'selected' : ''} row-${approvalTone(row.approval)}`}
                      onClick={() => open()}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
                    >
                      <td className="mono-cell"><TextCell canEdit={canEdit} className="num" value={row.number} onChange={v => update(row.id, { number: v })} /></td>
                      <td>
                        {row.foodTruckImageUrl
                          ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} loading="lazy" />
                          : <span className="thumb empty" />}
                      </td>
                      <td><span className={`pill ${isPinned(row.mapPin) ? 'green' : 'gray'}`}>{isPinned(row.mapPin) ? 'על המפה' : 'לא סומן'}</span></td>
                      <td><TextCell canEdit={canEdit} value={row.complexName} onChange={v => update(row.id, { complexName: v })} /></td>
                      <td className="col-name"><TextCell canEdit={canEdit} strong value={row.positionName} onChange={v => update(row.id, { positionName: v })} /></td>
                      <td className={b('businessName')}><TextCell canEdit={canEdit} value={row.businessName} onChange={v => update(row.id, { businessName: v })} /></td>
                      <td><TextCell canEdit={canEdit} value={row.ownerName} onChange={v => update(row.id, { ownerName: v })} /></td>
                      <td className={b('water')}><InfraCell value={row.water} canEdit={canEdit} onChange={v => update(row.id, { water: v })} /></td>
                      <td><InfraCell value={row.electricity} canEdit={canEdit} onChange={v => update(row.id, { electricity: v })} /></td>
                      <td><InfraCell value={row.sewage} canEdit={canEdit} onChange={v => update(row.id, { sewage: v })} /></td>
                      <td className={b('buildingQuality')}><SelectCell canEdit={canEdit} value={row.buildingQuality} options={BUILDING_OPTIONS} tone={qualityTone} onChange={v => update(row.id, { buildingQuality: v })} /></td>
                      <td><SelectCell canEdit={canEdit} value={row.environmentQuality} options={ENV_OPTIONS} tone={qualityTone} onChange={v => update(row.id, { environmentQuality: v })} /></td>
                      <td className={b('approval')}><SelectCell canEdit={canEdit} value={row.approval} options={APPROVAL_OPTIONS} tone={approvalTone} onChange={v => changeApproval(row.id, v)} /></td>
                      <td>
                        <button type="button" className={`pill button ${harmonicaTone(row.harmonicaStatus)}`} onClick={e => { stop(e); open('harmonica'); }} title="פתיחת לשונית ההרמוניקה">
                          {row.harmonicaStatus || 'לא הוגשה'}{corrections ? ` · ${corrections} הערות` : ''}
                        </button>
                      </td>
                      <td><TextCell canEdit={canEdit} className="notes-text" value={row.notes} onChange={v => update(row.id, { notes: v })} /></td>
                    </tr>
                  );
                })}
              </tbody>
              {groups.length > 1 && <tbody className="group-gap" aria-hidden="true"><tr><td colSpan={COLUMNS.length} /></tr></tbody>}
            </Fragment>
          ))}
        </table>
      </div>
      <div className="pagination"><span>{filtered.length} עמדות{groups.length > 1 ? ` · ${groups.length} קבוצות` : ''}</span></div>
    </section>
  );
}
