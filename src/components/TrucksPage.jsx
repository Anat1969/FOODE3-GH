import { useMemo, useState, useRef, useEffect } from 'react';

// Food truck agreements (from the municipal Excel), kept in foode_trucks and written only through foode_write.
const TYPES = ['פרטי', 'חברה לתיירות'];
const DAY = 86400000;
const fmt = (d) => (d ? d.split('-').reverse().join('.') : '—');
const daysLeft = (d) => (d ? Math.round((new Date(d) - new Date()) / DAY) : null);

// Red: ended. Orange: ends within 6 months. Green: running.
function endTone(d) {
  const n = daysLeft(d);
  if (n === null) return 'gray';
  return n < 0 ? 'red' : n <= 180 ? 'orange' : 'green';
}

const stop = e => e.stopPropagation();

function Cell({ value, onChange, canEdit, type = 'text', strong, ltr }) {
  if (!canEdit) {
    const shown = type === 'date' ? fmt(value) : value || '—';
    return strong ? <strong>{shown}</strong> : <span dir={ltr ? 'ltr' : undefined}>{shown}</span>;
  }
  return (
    <input
      className={`cell-input ${strong ? 'strong' : ''}`}
      type={type}
      dir={ltr ? 'ltr' : undefined}
      value={value || ''}
      placeholder="—"
      onClick={stop}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      onChange={e => onChange(type === 'date' && !e.target.value ? null : e.target.value)}
    />
  );
}

// One line per agreement on a shared time axis: start to end (solid), end to option (light), and a "today" line.
function Timeline({ row, domain }) {
  const [min, max] = domain;
  const x = (d) => `${((new Date(d) - min) / (max - min)) * 100}%`;
  if (!row.start_date || !row.end_date) return <span className="truck-tl empty" />;
  const tone = endTone(row.end_date);
  return (
    <span className="truck-tl" title={`${fmt(row.start_date)} עד ${fmt(row.end_date)}${row.option_until ? `, אופציה עד ${fmt(row.option_until)}` : ''}`}>
      {row.option_until && row.option_until > row.end_date && (
        <i className="tl-option" style={{ insetInlineStart: x(row.end_date), width: `calc(${x(row.option_until)} - ${x(row.end_date)})` }} />
      )}
      <i className={`tl-term ${tone}`} style={{ insetInlineStart: x(row.start_date), width: `calc(${x(row.end_date)} - ${x(row.start_date)})` }} />
      <i className="tl-today" style={{ insetInlineStart: x(new Date().toISOString().slice(0, 10)) }} />
    </span>
  );
}

export default function TrucksPage({ trucks, save, remove, positions, canEdit, openCard }) {
  const [term, setTerm] = useState('');
  // Typing shows at once and is written 450ms after the last keystroke, so answers cannot arrive out of order.
  const [drafts, setDrafts] = useState({});
  const timers = useRef({});
  const pending = useRef({});
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);
  const set = (id, data) => {
    pending.current[id] = { ...pending.current[id], ...data };
    setDrafts(d => ({ ...d, [id]: { ...d[id], ...data } }));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      const out = pending.current[id];
      delete pending.current[id];
      save(id, out).catch(() => {}).finally(() => setDrafts(d => { const n = { ...d }; delete n[id]; return n; }));
    }, 450);
  };
  const rows = useMemo(() => {
    const merged = trucks.map(r => (drafts[r.id] ? { ...r, ...drafts[r.id] } : r));
    for (const id of Object.keys(drafts)) if (!trucks.some(r => r.id === id)) merged.push({ id, ...drafts[id] });
    return merged.sort((a, b) => Number(a.number) - Number(b.number));
  }, [trucks, drafts]);
  const posById = useMemo(() => Object.fromEntries(positions.map(p => [p.id, p])), [positions]);

  const t = term.trim().toLowerCase();
  const shown = !t ? rows : rows.filter(r =>
    [r.number, r.owner_name, r.business_label, r.location, r.owner_type, r.phone, r.status, posById[r.position_id]?.positionName]
      .some(v => String(v || '').toLowerCase().includes(t)));

  const domain = useMemo(() => {
    const dates = rows.flatMap(r => [r.start_date, r.end_date, r.option_until]).filter(Boolean).map(d => +new Date(d));
    dates.push(Date.now());
    return [Math.min(...dates), Math.max(...dates)];
  }, [rows]);

  const ended = rows.filter(r => endTone(r.end_date) === 'red').length;
  const soon = rows.filter(r => endTone(r.end_date) === 'orange').length;
  const linked = rows.filter(r => r.position_id && posById[r.position_id]).length;

  return (
    <section className="table-shell panel trucks-page">
      <div className="section-title">
        <div>
          <h2>הסכמי פודטראקים</h2>
          <div className="truck-stats">
            <span><strong>{rows.length}</strong> הסכמים</span>
            <span className={soon ? 'orange' : ''}><strong>{soon}</strong> מסתיימים בחצי השנה הקרובה</span>
            {ended > 0 && <span className="red"><strong>{ended}</strong> הסתיימו</span>}
            <span><strong>{linked}</strong> מקושרים לעמדה</span>
          </div>
          <p className={`mode-tag ${canEdit ? 'edit' : 'view'}`}>{canEdit ? 'עריכה: כל שדה נשמר מעצמו' : 'תצוגה בלבד: עריכה דרך קישור העריכה'}</p>
        </div>
        <div className="actions">
          <div className="search-box">
            <input type="search" className="table-search-input" placeholder="חיפוש בכל השדות" aria-label="חיפוש בהסכמים" value={term} onChange={e => setTerm(e.target.value)} />
            {t && <span className="table-search-count">{shown.length} תוצאות</span>}
          </div>
          {canEdit && (
            <button
              className="icon-btn add large"
              aria-label="הוספת הסכם"
              title="הוספת הסכם"
              onClick={() => set(crypto.randomUUID(), { number: String(Math.max(0, ...rows.map(r => Number(r.number) || 0)) + 1), owner_type: 'פרטי' })}
            >+</button>
          )}
        </div>
      </div>

      <div className="truck-legend" aria-label="מקרא ציר הזמן">
        <span><i className="tl-term green" />תקופת ההסכם</span>
        <span><i className="tl-term orange" />מסתיים בחצי שנה</span>
        <span><i className="tl-term red" />הסתיים</span>
        <span><i className="tl-option" />אופציה</span>
        <span><i className="tl-today" />היום</span>
      </div>

      <div className="table-wrap">
        <table className="trucks-table">
          <thead>
            <tr>
              {['מס׳', 'בעל הפודטראק ועסק', 'מיקום', 'עמדה', 'סוג', 'טלפון', 'הפעלה', 'סיום', 'אופציה עד', 'ציר זמן', 'סטטוס'].map(h => <th key={h}>{h}</th>)}
              {canEdit && <th aria-label="הסרה" />}
            </tr>
          </thead>
          <tbody>
            {shown.map(r => {
              const pos = posById[r.position_id];
              return (
                <tr key={r.id}>
                  <td className="mono-cell" data-label="מס׳"><Cell canEdit={canEdit} value={r.number} onChange={v => set(r.id, { number: v })} /></td>
                  <td className="col-name owner-cell" data-label="בעל הפודטראק">
                    <Cell canEdit={canEdit} strong value={r.owner_name} onChange={v => set(r.id, { owner_name: v })} />
                    {(canEdit || r.business_label) && <span className="owner-business"><Cell canEdit={canEdit} value={r.business_label} onChange={v => set(r.id, { business_label: v })} /></span>}
                  </td>
                  <td data-label="מיקום"><Cell canEdit={canEdit} value={r.location} onChange={v => set(r.id, { location: v })} /></td>
                  <td data-label="עמדה">
                    {canEdit ? (
                      <select className="pill-select tone-gray" value={r.position_id || ''} onChange={e => set(r.id, { position_id: e.target.value || null })}>
                        <option value="">ללא</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.number}. {p.positionName}</option>)}
                      </select>
                    ) : pos ? (
                      <button type="button" className="pill button blue" onClick={() => openCard(pos.id)} title="פתיחת כרטיס העמדה">{pos.number}. {pos.positionName}</button>
                    ) : <span className="pill gray">ללא</span>}
                  </td>
                  <td data-label="סוג">
                    {canEdit ? (
                      <select className="pill-select tone-gray" value={r.owner_type || ''} onChange={e => set(r.id, { owner_type: e.target.value })}>
                        {[...new Set([...TYPES, r.owner_type].filter(Boolean))].map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : r.owner_type || '—'}
                  </td>
                  <td data-label="טלפון">{canEdit ? <Cell canEdit ltr value={r.phone} onChange={v => set(r.id, { phone: v })} /> : r.phone ? <a href={`tel:${r.phone}`} dir="ltr">{r.phone}</a> : '—'}</td>
                  <td data-label="הפעלה"><Cell canEdit={canEdit} type="date" value={r.start_date} onChange={v => set(r.id, { start_date: v })} /></td>
                  <td className={`end-${endTone(r.end_date)}`} data-label="סיום"><Cell canEdit={canEdit} type="date" value={r.end_date} onChange={v => set(r.id, { end_date: v })} /></td>
                  <td data-label="אופציה עד"><Cell canEdit={canEdit} type="date" value={r.option_until} onChange={v => set(r.id, { option_until: v })} /></td>
                  <td className="tl-cell" data-label="ציר זמן"><Timeline row={r} domain={domain} /></td>
                  <td className="notes-text" data-label="סטטוס"><Cell canEdit={canEdit} value={r.status} onChange={v => set(r.id, { status: v })} /></td>
                  {canEdit && (
                    <td className="remove-cell"><button type="button" className="icon-btn" aria-label="הסרת הסכם" title="הסרה" onClick={() => { if (window.confirm(`להסיר את הסכם ${r.number}? אפשר לשחזר.`)) remove(r.id); }}>×</button></td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{shown.length} הסכמים</span></div>
    </section>
  );
}
