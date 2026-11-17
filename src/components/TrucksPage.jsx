import { useState } from 'react';
import SliceWindow, { applyConditions } from './SliceWindow.jsx';
const TYPES = ['פרטי', 'חברה לתיירות'];
const fmt = (d) => (d ? d.split('-').reverse().join('.') : '—');

function daysLeft(d) {
  if (!d) return null;
  return Math.round((new Date(d) - new Date()) / 86400000);
}

function endClass(d) {
  const n = daysLeft(d);
  if (n === null) return '';
  return n < 0 ? 'red' : n <= 180 ? 'orange' : 'green';
}

const COLS = [
  ['number', 'מס׳'], ['ownerName', 'בעל הפודטראק'], ['location', 'מיקום'], ['positionId', 'עמדה מקושרת'],
  ['ownerType', 'סוג'], ['phone', 'טלפון'], ['startDate', 'תאריך הפעלה'], ['endDate', 'סיום הסכם'],
  ['optionUntil', 'אופציה עד'], ['status', 'סטטוס'],
];
const SLICE_COLUMNS = [
  { key: 'ownerName', label: 'בעל הפודטראק', kind: 'text' },
  { key: 'location', label: 'מיקום', kind: 'select' },
  { key: 'ownerType', label: 'סוג', kind: 'select' },
  { key: 'status', label: 'סטטוס', kind: 'select' },
];

export default function TrucksPage({ trucks: all, update, positions, editMode }) {
  const [sortCol, setSortCol] = useState('number');
  const [asc, setAsc] = useState(true);
  const [conditions, setConditions] = useState([]);
  const trucks = applyConditions(all, conditions, SLICE_COLUMNS).sort((a, b) => {
    const x = a[sortCol] ?? '', y = b[sortCol] ?? '';
    const cmp = sortCol === 'number' ? Number(x) - Number(y) : String(x).localeCompare(String(y), 'he');
    return asc ? cmp : -cmp;
  });
  const soon = all.filter(t => { const n = daysLeft(t.endDate); return n !== null && n >= 0 && n <= 180; }).length;
  const posName = (id) => positions.find(p => p.id === id)?.positionName;

  return (
    <section className="table-shell glass-panel">
      <div className="section-title">
        <div>
          <h2>פודטראקים והסכמים</h2>
          <p>{trucks.length} מתוך {all.length} הסכמים · {soon} מסתיימים ב-6 החודשים הקרובים</p>
        </div>
        <div className="actions"><SliceWindow columns={SLICE_COLUMNS} rows={all} conditions={conditions} setConditions={setConditions} /></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COLS.map(([k, h]) => (
                <th key={k}><span className="th-name">{h}
                  <span className="th-arrows">
                    <button className={sortCol === k && asc ? 'on' : ''} onClick={() => { setSortCol(k); setAsc(true); }} aria-label={`מיון עולה לפי ${h}`}>▲</button>
                    <button className={sortCol === k && !asc ? 'on' : ''} onClick={() => { setSortCol(k); setAsc(false); }} aria-label={`מיון יורד לפי ${h}`}>▼</button>
                  </span></span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trucks.map(t => (
              <tr key={t.id}>
                <td>{t.number}</td>
                <td className="col-name">
                  {editMode
                    ? <input value={t.ownerName} onChange={e => update(t.id, { ownerName: e.target.value })} />
                    : <><strong>{t.ownerName}</strong>{t.businessLabel && <span className="notes-text"> · {t.businessLabel}</span>}</>}
                </td>
                <td>{editMode ? <input value={t.location} onChange={e => update(t.id, { location: e.target.value })} /> : t.location}</td>
                <td>
                  {editMode ? (
                    <select className="inline-select" value={t.positionId || ''} onChange={e => update(t.id, { positionId: e.target.value || null })}>
                      <option value="">—</option>
                      {positions.map(p => <option key={p.id} value={p.id}>{p.number}. {p.positionName}</option>)}
                    </select>
                  ) : (posName(t.positionId) || '—')}
                </td>
                <td>
                  {editMode ? (
                    <select className="inline-select" value={t.ownerType} onChange={e => update(t.id, { ownerType: e.target.value })}>
                      {TYPES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : t.ownerType}
                </td>
                <td dir="ltr" style={{ textAlign: 'right' }}>
                  {editMode ? <input value={t.phone} onChange={e => update(t.id, { phone: e.target.value })} /> : <a href={`tel:${t.phone}`}>{t.phone}</a>}
                </td>
                <td>{editMode ? <input type="date" value={t.startDate || ''} onChange={e => update(t.id, { startDate: e.target.value })} /> : fmt(t.startDate)}</td>
                <td>
                  {editMode
                    ? <input type="date" value={t.endDate || ''} onChange={e => update(t.id, { endDate: e.target.value })} />
                    : <span className={`approval-light ${endClass(t.endDate)}`}>{fmt(t.endDate)}</span>}
                </td>
                <td>{editMode ? <input type="date" value={t.optionUntil || ''} onChange={e => update(t.id, { optionUntil: e.target.value })} /> : fmt(t.optionUntil)}</td>
                <td>{editMode ? <input value={t.status} onChange={e => update(t.id, { status: e.target.value })} /> : <span className="notes-text">{t.status || '—'}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
