import { useState, useMemo } from 'react';
import Chip from './Chip.jsx';
import { approvalKind } from '../utils/colors.js';
import SliceWindow, { applyConditions } from './SliceWindow.jsx';

const approvalOptions = ['מיקום מקובל', 'בבדיקה', 'מיקום לא מקובל'];
const GROUPS = { infra: 'תשתיות', quality: 'איכות' };
const STORAGE_KEY = 'foode_col_order_v1';

const COLUMNS = [
  { key: 'number', label: 'מספר', filter: 'none' },
  { key: 'foodTruckImageUrl', label: 'תמונה', sortable: false, filter: 'none' },
  { key: 'positionName', label: 'שם עמדה', filter: 'text' },
  { key: 'approval', label: 'האם מקובלת', filter: 'select' },
  { key: 'complexName', label: 'שם מתחם', filter: 'select' },
  { key: 'businessName', label: 'שם עסק', filter: 'text' },
  { key: 'water', label: 'מים', group: 'infra', check: true, filter: 'select' },
  { key: 'electricity', label: 'חשמל', group: 'infra', check: true, filter: 'select' },
  { key: 'sewage', label: 'ביוב', group: 'infra', check: true, filter: 'select' },
  { key: 'buildingQuality', label: 'מבנה', group: 'quality', filter: 'select' },
  { key: 'environmentQuality', label: 'סביבה', group: 'quality', filter: 'select' },
  { key: 'notes', label: 'הערות', filter: 'text' },
  { key: '_pin', label: 'מפה', sortable: false, filter: 'none' },
];
const checkDisplay = (v) => (v === 'טוב' ? 'תקין' : 'לא תקין');
const SLICE_COLUMNS = [
  { key: 'positionName', label: 'שם עמדה', kind: 'text' },
  { key: 'complexName', label: 'שם מתחם', kind: 'select' },
  { key: 'approval', label: 'האם מקובלת', kind: 'select' },
  { key: 'businessName', label: 'שם עסק', kind: 'text' },
  { key: 'water', label: 'מים', kind: 'select', display: checkDisplay },
  { key: 'electricity', label: 'חשמל', kind: 'select', display: checkDisplay },
  { key: 'sewage', label: 'ביוב', kind: 'select', display: checkDisplay },
  { key: 'buildingQuality', label: 'איכות מבנה', kind: 'select' },
  { key: 'environmentQuality', label: 'איכות סביבה', kind: 'select' },
  { key: 'notes', label: 'הערות', kind: 'text' },
];
const BY_KEY = Object.fromEntries(COLUMNS.map(c => [c.key, c]));

const VALUE_RANK = { 'טוב': 0, 'לא טוב': 1, 'יש': 0, 'אין': 1, 'מיקום מקובל': 0, 'בבדיקה': 1, 'מיקום לא מקובל': 2 };

function compareValues(a, b) {
  const ra = VALUE_RANK[a], rb = VALUE_RANK[b];
  if (ra !== undefined && rb !== undefined) return ra - rb;
  const na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a || '').localeCompare(String(b || ''), 'he');
}

const COMPLEX_COLORS = ['#3f6f8f', '#8a6a2f', '#5b7f4a', '#8a4f6e', '#4f7f7a', '#7a5a9a', '#9a5a3a'];
export function complexColor(name, all) {
  const i = Math.max(0, all.indexOf(name));
  return COMPLEX_COLORS[i % COMPLEX_COLORS.length];
}

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length === COLUMNS.length && saved.every(k => BY_KEY[k])) return saved;
  } catch { /* ignore */ }
  return COLUMNS.map(c => c.key);
}

function Mark({ value, onChange, editMode }) {
  const good = value === 'טוב';
  const label = good ? 'תקין' : 'לא תקין';
  const cls = `mark ${good ? 'good' : 'bad'}`;
  if (!editMode) return <span className={cls} title={label} aria-label={label}>{good ? '✓' : '✗'}</span>;
  return (
    <button className={`${cls} editable`} title={`${label} (לחיצה להחלפה)`} aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(good ? 'לא טוב' : 'טוב'); }}>
      {good ? '✓' : '✗'}
    </button>
  );
}

export default function PositionsTable({ positions, update, add, remove, selectedId, setSelectedId, setPage, setPinningId, editMode }) {
  const [sortCol, setSortCol] = useState('approval');
  const [sortAsc, setSortAsc] = useState(true);
  const [order, setOrder] = useState(loadOrder);
  const [conditions, setConditions] = useState([]);
  const [grouped, setGrouped] = useState(true);
  const [dragKey, setDragKey] = useState(null);

  const goPin = (id) => { setSelectedId(id); setPinningId(id); setPage('map'); };
  const cols = order.map(k => BY_KEY[k]);
  const complexes = useMemo(() => [...new Set(positions.map(p => p.complexName))].sort((a, b) => String(a).localeCompare(String(b), 'he')), [positions]);

  const saveOrder = (next) => {
    setOrder(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const moveCol = (from, to) => {
    if (!from || from === to) return;
    const next = order.filter(k => k !== from);
    next.splice(next.indexOf(to) + (order.indexOf(from) < order.indexOf(to) ? 1 : 0), 0, from);
    saveOrder(next);
  };

  const activeCount = conditions.filter(c => c.col && c.val).length;

  const rows = useMemo(() => {
    let list = applyConditions(positions, conditions, SLICE_COLUMNS);
    list = [...list].sort((a, b) => {
      const cmp = compareValues(a[sortCol], b[sortCol]);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [positions, conditions, sortCol, sortAsc]);

  const sections = useMemo(() => {
    if (!grouped) return [{ name: null, rows }];
    const names = [...new Set(rows.map(r => r.complexName))];
    names.sort((a, b) => String(a).localeCompare(String(b), 'he') * (sortCol === 'complexName' && !sortAsc ? -1 : 1));
    return names.map(n => ({ name: n, rows: rows.filter(r => r.complexName === n) }));
  }, [rows, grouped, sortCol, sortAsc]);

  // header group spans: consecutive columns with the same group are merged
  const groupRuns = [];
  cols.forEach(c => {
    const last = groupRuns[groupRuns.length - 1];
    if (c.group && last && last.group === c.group) last.cols.push(c);
    else groupRuns.push({ group: c.group || null, cols: [c] });
  });

  const dragProps = (c) => ({
    draggable: true,
    onDragStart: (e) => { setDragKey(c.key); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => { e.preventDefault(); moveCol(dragKey, c.key); setDragKey(null); },
    onDragEnd: () => setDragKey(null),
  });

  const Label = ({ c }) => (
    <span className="th-label" title="גרירה להזזת העמודה">
      <span className="th-name">
        {c.label}
        {c.sortable !== false && (
          <span className="th-arrows">
            <button className={sortCol === c.key && sortAsc ? 'on' : ''} onClick={() => { setSortCol(c.key); setSortAsc(true); }} aria-label={`מיון עולה לפי ${c.label}`}>▲</button>
            <button className={sortCol === c.key && !sortAsc ? 'on' : ''} onClick={() => { setSortCol(c.key); setSortAsc(false); }} aria-label={`מיון יורד לפי ${c.label}`}>▼</button>
          </span>
        )}
      </span>
      {c.check && <small className="th-sub"><b className="good">✓</b> תקין · <b className="bad">✗</b> לא תקין</small>}
    </span>
  );

  const renderCell = (c, row, color) => {
    const gc = c.group ? ` col-${c.group}` : '';
    switch (c.key) {
      case 'number': return <td key={c.key}>{row.number}</td>;
      case 'foodTruckImageUrl': return <td key={c.key}><span className="thumb-box">{row.foodTruckImageUrl ? <img src={row.foodTruckImageUrl} alt={row.foodTruckImageAlt || row.positionName} /> : <span className="thumb-empty">—</span>}</span></td>;
      case 'positionName': return (
        <td key={c.key} className="col-name">
          {editMode ? <input value={row.positionName} onChange={e => update(row.id, { positionName: e.target.value })} /> : (
            <><i className="cx-dot" style={{ background: color }} /><strong>{row.positionName}</strong>{selectedId === row.id && <span className="selected-tag">נבחר</span>}</>
          )}
        </td>);
      case 'approval': return (
        <td key={c.key}>
          {editMode ? (
            <select className="inline-select status" value={row.approval} onChange={e => update(row.id, { approval: e.target.value, status: e.target.value })}>
              {approvalOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : <Chip value={row.approval} type="status" />}
        </td>);
      case 'complexName': return <td key={c.key}>{editMode ? <input value={row.complexName} onChange={e => update(row.id, { complexName: e.target.value })} /> : row.complexName}</td>;
      case 'businessName': return <td key={c.key}>{editMode ? <input value={row.businessName} onChange={e => update(row.id, { businessName: e.target.value })} /> : row.businessName}</td>;
      case 'water': case 'electricity': case 'sewage':
        return <td key={c.key} className={`center${gc}`}><Mark value={row[c.key]} editMode={editMode} onChange={v => update(row.id, { [c.key]: v })} /></td>;
      case 'buildingQuality': case 'environmentQuality': return <td key={c.key} className={gc.trim()}><Chip value={row[c.key]} /></td>;
      case 'notes': return <td key={c.key}>{editMode ? <input value={row.notes || ''} onChange={e => update(row.id, { notes: e.target.value })} /> : <span className="notes-text">{row.notes || '—'}</span>}</td>;
      case '_pin': {
        const pinned = row.mapPin && (Math.abs(row.mapPin.x - 34.6415) > 0.0001 || Math.abs(row.mapPin.y - 31.8014) > 0.0001);
        return <td key={c.key}>{pinned
          ? <span className="pinned-badge" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>נעוץ</span>
          : <button className="pin-button" onClick={(e) => { e.stopPropagation(); goPin(row.id); }}>סימון</button>}</td>;
      }
      default: return <td key={c.key} />;
    }
  };

  const orderChanged = order.some((k, i) => k !== COLUMNS[i].key);

  return (
    <section className="table-shell glass-panel">
      <div className="section-title">
        <div><h2>רשימת עמדות</h2><p>{rows.length} מתוך {positions.length} עמדות · {editMode ? 'מצב עריכה' : 'לחיצה על עמדה פותחת פרטים'}</p></div>
        <div className="actions">
          <button className={grouped ? 'toggle on' : 'toggle'} onClick={() => setGrouped(!grouped)}>{grouped ? 'מקובץ לפי מתחם' : 'ללא קיבוץ'}</button>
          <SliceWindow columns={SLICE_COLUMNS} rows={positions} conditions={conditions} setConditions={setConditions} />
          {orderChanged && <button onClick={() => saveOrder(COLUMNS.map(c => c.key))}>איפוס סדר עמודות</button>}
          {editMode && <button className="primary" onClick={() => setSelectedId(add())}>הוספת עמדה</button>}
          {editMode && <button onClick={() => selectedId && remove(selectedId)}>מחיקה</button>}
        </div>
      </div>
      <p className="hint-line">מיון בחצים שליד שם העמודה, גרירת כותרת לסידור העמודות, ו"חיתוך נתונים" לבחירת עמודה וערך.</p>
      <div className="table-wrap">
        <table className="pos-table">
          <thead>
            <tr className="group-row">
              {groupRuns.map((run, i) => run.group
                ? <th key={i} colSpan={run.cols.length} className={`group-th ${run.group}`}>{GROUPS[run.group]}</th>
                : <th key={i} rowSpan={2} className={`sortable ${dragKey === run.cols[0].key ? 'dragging' : ''}`} {...dragProps(run.cols[0])}><Label c={run.cols[0]} /></th>)}
            </tr>
            <tr className="sub-row">
              {cols.filter(c => c.group).map(c => (
                <th key={c.key} className={`sortable ${c.group} ${dragKey === c.key ? 'dragging' : ''}`} {...dragProps(c)}><Label c={c} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={cols.length} className="empty-row">אין עמדות שמתאימות לחיתוך או לחיפוש. אפשר לנקות את החיתוך או את החיפוש בסרגל.</td></tr>}
            {sections.map(sec => [
              sec.name !== null && (
                <tr key={`h-${sec.name}`} className="complex-row">
                  <td colSpan={cols.length} style={{ '--cx': complexColor(sec.name, complexes) }}>
                    <b>{sec.name || 'ללא מתחם'}</b><span>{sec.rows.length} עמדות</span>
                  </td>
                </tr>
              ),
              ...sec.rows.map(row => (
                <tr key={row.id} className={`${selectedId === row.id ? 'selected' : ''} approval-${approvalKind(row.approval)}`} onClick={() => setSelectedId(row.id)}>
                  {cols.map(c => renderCell(c, row, complexColor(row.complexName, complexes)))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </section>
  );
}
