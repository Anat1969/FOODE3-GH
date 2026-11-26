import { useState, useMemo, Fragment, cloneElement } from 'react';
import {
  APPROVAL_OPTIONS, BUILDING_OPTIONS, ENV_OPTIONS,
  approvalTone, qualityTone, harmonicaTone, withCurrent,
} from '../utils/colors.js';
import { isPinned } from './PositionCard.jsx';

function Pill({ tone, children }) {
  return <span className={`pill ${tone}`}>{children || '—'}</span>;
}

const stop = e => e.stopPropagation();

// Infrastructure as a mark: green check for working, red cross for missing.
function InfraCell({ value, onChange, canEdit }) {
  const good = value === 'טוב';
  const label = good ? 'תקין' : 'חסר';
  const cls = `mark ${good ? 'good' : 'bad'}`;
  if (!canEdit) return <span className={cls} role="img" aria-label={label} title={label}>{good ? '✓' : '✗'}</span>;
  return (
    <button type="button" className={`${cls} editable`} aria-label={label} title={`${label}: לחיצה מחליפה`} onClick={(e) => { stop(e); onChange(good ? 'לא טוב' : 'טוב'); }}>
      {good ? '✓' : '✗'}
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

// group: topic band; groupBy: sorting by this column frames rows into groups; filter: the control under the header
const COLUMNS = [
  { key: 'number', label: 'מספר', group: 'זיהוי' },
  { key: 'foodTruckImageUrl', label: 'תמונה', sortable: false, group: 'זיהוי' },
  { key: '_pin', label: 'מיקום', sortable: false, group: 'זיהוי' },
  { key: 'complexName', label: 'שם מתחם', group: 'זיהוי', groupBy: true, filter: 'select' },
  { key: 'positionName', label: 'שם עמדה', group: 'זיהוי', filter: 'text' },
  { key: 'businessName', label: 'שם עסק', group: 'עסק', groupBy: true, filter: 'text' },
  { key: 'ownerName', label: 'שם בעלים', group: 'עסק', groupBy: true, filter: 'text' },
  { key: 'water', label: 'מים', group: 'תשתיות', groupBy: true, infra: true, filter: 'select' },
  { key: 'electricity', label: 'חשמל', group: 'תשתיות', groupBy: true, infra: true, filter: 'select' },
  { key: 'sewage', label: 'ביוב', group: 'תשתיות', groupBy: true, infra: true, filter: 'select' },
  { key: 'buildingQuality', label: 'עיצוב המבנה', group: 'איכות', groupBy: true, filter: 'select' },
  { key: 'environmentQuality', label: 'איכות הסביבה', group: 'איכות', groupBy: true, filter: 'select' },
  { key: 'approval', label: 'סטטוס מיקום', group: 'סטטוס', groupBy: true, filter: 'select' },
  { key: 'harmonicaStatus', label: 'הרמוניקה', group: 'סטטוס', groupBy: true, filter: 'select' },
  { key: 'notes', label: 'הערות', group: 'סטטוס', filter: 'text' },
];
// Topic tints: infrastructure and quality columns carry a quiet background, top to bottom.
const TINT = { 'תשתיות': 'tint-infra', 'איכות': 'tint-quality' };
const BY_KEY = Object.fromEntries(COLUMNS.map(c => [c.key, c]));
const DEFAULT_ORDER = COLUMNS.map(c => c.key);
const ORDER_KEY = 'foode3-col-order';
const GROUP_KEY = 'foode3-group-complex';

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
    if (Array.isArray(saved) && saved.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every(k => saved.includes(k))) return saved;
  } catch { /* storage blocked: default order */ }
  return DEFAULT_ORDER;
}
function loadGroup() {
  try { return localStorage.getItem(GROUP_KEY) !== 'off'; } catch { return true; }
}

// One quiet color per complex, so a row's complex reads at a glance.
const COMPLEX_HUES = [205, 32, 140, 330, 175, 265, 12, 95];
export function complexHue(name, all) {
  return COMPLEX_HUES[Math.max(0, all.indexOf(name)) % COMPLEX_HUES.length];
}

const INFRA_LABEL = { 'טוב': 'תקין', 'לא טוב': 'חסר' };
const optionLabel = (col, v) => (col.infra ? INFRA_LABEL[v] || v : v);

const FILTER_LABELS = { approved: 'מיקום מקובל', pending: 'בבדיקה', rejected: 'מיקום לא מקובל', all: 'כל העמדות', complexes: 'כל העמדות', harmonica: 'הרמוניקה ממתינה' };

export default function PositionsTable({
  positions, allPositions, update, changeApproval, add, selectedId, openCard,
  canEdit, statsFilter, onClearFilter, openCorrectionsById,
}) {
  const [sortCol, setSortCol] = useState('number');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [order, setOrder] = useState(loadOrder);
  const [byComplex, setByComplex] = useState(loadGroup);
  const [dragKey, setDragKey] = useState(null);
  const [dropKey, setDropKey] = useState(null);

  const handleSort = (key) => {
    if (key === sortCol) setSortAsc(!sortAsc);
    else { setSortCol(key); setSortAsc(true); }
  };

  const saveOrder = (next) => {
    setOrder(next);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  };
  const moveCol = (from, to) => {
    if (!from || !to || from === to) return;
    const next = order.filter(k => k !== from);
    next.splice(next.indexOf(to) + (order.indexOf(from) < order.indexOf(to) ? 1 : 0), 0, from);
    saveOrder(next);
  };
  const toggleComplex = () => {
    setByComplex(v => {
      try { localStorage.setItem(GROUP_KEY, v ? 'off' : 'on'); } catch { /* storage blocked */ }
      return !v;
    });
  };

  // Column order decides the topic bands: consecutive columns of one topic share a band.
  const cols = order.map(k => ({ ...BY_KEY[k] }));
  cols.forEach((c, i) => { c.bandStart = i > 0 && cols[i - 1].group !== c.group; });
  const colGroups = cols.reduce((groups, col) => {
    const last = groups[groups.length - 1];
    if (last && last.name === col.group) last.span++;
    else groups.push({ name: col.group, span: 1, bandStart: col.bandStart, infra: col.infra });
    return groups;
  }, []);

  const complexes = useMemo(
    () => [...new Set(allPositions.map(p => p.complexName || ''))].sort((a, b) => a.localeCompare(b, 'he')),
    [allPositions],
  );
  const optionsFor = (key) => [...new Set(positions.map(p => p[key] || '').filter(Boolean))].sort(compareValues);

  const term = searchTerm.trim().toLowerCase();
  const activeFilters = Object.entries(filters).filter(([, v]) => v);
  const filtered = positions.filter(row => {
    if (term && ![row.number, row.positionName, row.complexName, row.businessName, row.ownerName, row.developerName,
      row.buildingQuality, row.environmentQuality, row.approval, row.harmonicaStatus, row.notes]
      .some(f => String(f || '').toLowerCase().includes(term))) return false;
    return activeFilters.every(([k, v]) => (BY_KEY[k].filter === 'text'
      ? String(row[k] || '').toLowerCase().includes(v.trim().toLowerCase())
      : (row[k] || '') === v));
  });

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[sortCol], b[sortCol]) || compareValues(a.number, b.number);
    return sortAsc ? cmp : -cmp;
  });

  // Sorting by a category frames rows by it; otherwise rows are framed by complex (when on).
  const sortColumn = BY_KEY[sortCol];
  const groupKey = sortColumn?.groupBy ? sortCol : byComplex ? 'complexName' : null;
  const groupCol = groupKey ? BY_KEY[groupKey] : null;
  const groups = [];
  if (groupCol) {
    for (const row of sorted) {
      const raw = row[groupKey] || '';
      const g = groups.find(x => x.key === raw);
      if (g) g.rows.push(row);
      else groups.push({ key: raw, label: groupCol.infra ? INFRA_LABEL[raw] || raw : raw || 'ללא', rows: [row] });
    }
  } else {
    groups.push({ key: '_all', label: null, rows: sorted });
  }

  const dragProps = (c) => ({
    draggable: true,
    onDragStart: (e) => { setDragKey(c.key); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.key); },
    onDragOver: (e) => { e.preventDefault(); if (dropKey !== c.key) setDropKey(c.key); },
    onDragLeave: () => setDropKey(k => (k === c.key ? null : k)),
    onDrop: (e) => { e.preventDefault(); moveCol(dragKey || e.dataTransfer.getData('text/plain'), c.key); setDragKey(null); setDropKey(null); },
    onDragEnd: () => { setDragKey(null); setDropKey(null); },
  });

  const cell = (c, row) => {
    const b = c.bandStart ? 'band-start' : '';
    const open = (tab = 'details') => openCard(row.id, tab);
    switch (c.key) {
      case 'number': return <td key={c.key} className={`mono-cell ${b}`}><TextCell canEdit={canEdit} className="num" value={row.number} onChange={v => update(row.id, { number: v })} /></td>;
      case 'foodTruckImageUrl': return (
        <td key={c.key} className={b}>
          {row.foodTruckImageUrl
            ? <img className="thumb" src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} loading="lazy" />
            : <span className="thumb empty" />}
        </td>);
      case '_pin': return <td key={c.key} className={b}><span className={`pill ${isPinned(row.mapPin) ? 'green' : 'gray'}`}>{isPinned(row.mapPin) ? 'על המפה' : 'לא סומן'}</span></td>;
      case 'complexName': return (
        <td key={c.key} className={b}>
          <span className="cx-cell"><i className="cx-dot" style={{ '--cx-h': complexHue(row.complexName || '', complexes) }} aria-hidden="true" />
            <TextCell canEdit={canEdit} value={row.complexName} onChange={v => update(row.id, { complexName: v })} /></span>
        </td>);
      case 'positionName': return <td key={c.key} className={`col-name ${b}`}><TextCell canEdit={canEdit} strong value={row.positionName} onChange={v => update(row.id, { positionName: v })} /></td>;
      case 'businessName': case 'ownerName':
        return <td key={c.key} className={b}><TextCell canEdit={canEdit} value={row[c.key]} onChange={v => update(row.id, { [c.key]: v })} /></td>;
      case 'water': case 'electricity': case 'sewage':
        return <td key={c.key} className={`center ${b}`}><InfraCell value={row[c.key]} canEdit={canEdit} onChange={v => update(row.id, { [c.key]: v })} /></td>;
      case 'buildingQuality': return <td key={c.key} className={b}><SelectCell canEdit={canEdit} value={row.buildingQuality} options={BUILDING_OPTIONS} tone={qualityTone} onChange={v => update(row.id, { buildingQuality: v })} /></td>;
      case 'environmentQuality': return <td key={c.key} className={b}><SelectCell canEdit={canEdit} value={row.environmentQuality} options={ENV_OPTIONS} tone={qualityTone} onChange={v => update(row.id, { environmentQuality: v })} /></td>;
      case 'approval': return <td key={c.key} className={b}><SelectCell canEdit={canEdit} value={row.approval} options={APPROVAL_OPTIONS} tone={approvalTone} onChange={v => changeApproval(row.id, v)} /></td>;
      case 'harmonicaStatus': {
        const corrections = openCorrectionsById[row.id] || 0;
        return (
          <td key={c.key} className={b}>
            <button type="button" className={`pill button ${harmonicaTone(row.harmonicaStatus)}`} onClick={e => { stop(e); open('harmonica'); }} title="פתיחת לשונית ההרמוניקה">
              {row.harmonicaStatus || 'לא הוגשה'}{corrections ? ` · ${corrections} הערות` : ''}
            </button>
          </td>);
      }
      case 'notes': return <td key={c.key} className={b}><TextCell canEdit={canEdit} className="notes-text" value={row.notes} onChange={v => update(row.id, { notes: v })} /></td>;
      default: return <td key={c.key} />;
    }
  };

  const orderChanged = order.some((k, i) => k !== DEFAULT_ORDER[i]);

  return (
    <section className="table-shell panel">
      <div className="section-title">
        <div>
          <h2>מיקומי עמדות</h2>
          {statsFilter && (
            <div className="filter-badge">
              מסנן: {FILTER_LABELS[statsFilter] || statsFilter.replace('complex:', 'מתחם ')} ({positions.length} מתוך {allPositions.length})
              <button className="text-button" onClick={onClearFilter}>ניקוי</button>
            </div>
          )}
        </div>
        <div className="actions">
          <button type="button" className={`chip-toggle ${byComplex ? 'on' : ''}`} aria-pressed={byComplex} onClick={toggleComplex}>קיבוץ לפי מתחם</button>
          {activeFilters.length > 0 && <button type="button" className="text-button" onClick={() => setFilters({})}>ניקוי סינון ({activeFilters.length})</button>}
          {orderChanged && <button type="button" className="text-button" onClick={() => saveOrder(DEFAULT_ORDER)}>סדר עמודות מקורי</button>}
          <div className="search-box">
            <input
              type="search"
              className="table-search-input"
              placeholder="חיפוש בכל השדות"
              aria-label="חיפוש"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {(term || activeFilters.length > 0) && <span className="table-search-count">{filtered.length} תוצאות</span>}
          </div>
          {canEdit && <button className="icon-btn add large" aria-label="הוספת עמדה" title="הוספת עמדה" onClick={() => openCard(add(), 'details')}>+</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table className={groups.length > 1 ? 'grouped' : ''}>
          <thead>
            <tr className="col-group-row">
              {colGroups.map((g, i) => (
                <th key={`${g.name}-${i}`} colSpan={g.span} className={`col-group-header ${g.bandStart ? 'band-start' : ''} ${TINT[g.name] || ''}`}>
                  {g.name}
                  {g.infra && <span className="mark-legend"><b className="good">✓</b> תקין <b className="bad">✗</b> חסר</span>}
                </th>
              ))}
            </tr>
            <tr>
              {cols.map(col => {
                const isSorted = sortCol === col.key;
                const sortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    className={`${col.bandStart ? 'band-start' : ''} ${TINT[col.group] || ''} ${isSorted ? 'sorted' : ''} ${dragKey === col.key ? 'dragging' : ''} ${dropKey === col.key && dragKey !== col.key ? 'drop-target' : ''}`}
                    aria-sort={isSorted ? (sortAsc ? 'ascending' : 'descending') : undefined}
                    title="גרירה מזיזה את העמודה"
                    {...dragProps(col)}
                  >
                    {sortable ? (
                      <button type="button" className="sort-button" onClick={() => handleSort(col.key)} title="מיון לפי עמודה זו">
                        {col.label}
                        <span className="sort-arrow" aria-hidden="true">{isSorted ? (sortAsc ? '↑' : '↓') : '↕'}</span>
                      </button>
                    ) : col.label}
                  </th>
                );
              })}
            </tr>
            <tr className="filter-row">
              {cols.map(col => (
                <th key={col.key} className={`${col.bandStart ? 'band-start' : ''} ${TINT[col.group] || ''}`}>
                  {col.filter === 'select' && (
                    <select className="filter-input" value={filters[col.key] || ''} aria-label={`סינון לפי ${col.label}`} onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}>
                      <option value="">הכול</option>
                      {optionsFor(col.key).map(o => <option key={o} value={o}>{optionLabel(col, o)}</option>)}
                    </select>
                  )}
                  {col.filter === 'text' && (
                    <input className="filter-input" type="search" placeholder="סינון" aria-label={`סינון לפי ${col.label}`} value={filters[col.key] || ''} onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {filtered.length === 0 && (
            <tbody><tr><td colSpan={cols.length} className="empty-row">אין עמדות שמתאימות לחיפוש ולסינון.</td></tr></tbody>
          )}
          {groups.map(group => {
            const hue = groupKey === 'complexName' ? complexHue(group.key, complexes) : null;
            return (
              <Fragment key={group.key}>
                <tbody className={group.label !== null ? 'row-group' : ''} style={hue !== null ? { '--cx-h': hue } : undefined}>
                  {group.label !== null && (
                    <tr className={`group-head ${hue !== null ? 'complex' : ''}`}>
                      <td colSpan={cols.length}>
                        <span className="group-name">{group.label}</span>
                        <span className="mono-label">{group.rows.length} עמדות</span>
                      </td>
                    </tr>
                  )}
                  {group.rows.map(row => (
                    <tr
                      key={row.id}
                      className={`${selectedId === row.id ? 'selected' : ''} row-${approvalTone(row.approval)}`}
                      onClick={() => openCard(row.id)}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) openCard(row.id); }}
                    >
                      {cols.map(c => {
                        const el = cell(c, row);
                        return TINT[c.group] ? cloneElement(el, { className: `${el.props.className || ''} ${TINT[c.group]}` }) : el;
                      })}
                    </tr>
                  ))}
                </tbody>
                {groups.length > 1 && <tbody className="group-gap" aria-hidden="true"><tr><td colSpan={cols.length} /></tr></tbody>}
              </Fragment>
            );
          })}
        </table>
      </div>
      <div className="pagination"><span>{filtered.length} עמדות{groups.length > 1 ? ` · ${groups.length} קבוצות` : ''}</span></div>
    </section>
  );
}
