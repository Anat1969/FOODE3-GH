import { useState } from 'react';

/* חלון אחד לחיתוך נתונים: כל תנאי הוא עמודה וערך, וכל התנאים חלים יחד */
export function applyConditions(rows, conditions, columns) {
  return rows.filter(r => conditions.every(c => {
    if (!c.col || !c.val) return true;
    const col = columns.find(x => x.key === c.col);
    if (!col) return true;
    return col.kind === 'text' ? String(r[c.col] ?? '').includes(c.val) : String(r[c.col]) === c.val;
  }));
}

export default function SliceWindow({ columns, rows, conditions, setConditions }) {
  const [open, setOpen] = useState(false);
  const active = conditions.filter(c => c.col && c.val).length;
  const optionsOf = (col) => [...new Set(rows.map(r => r[col.key]).filter(v => v !== '' && v != null))].sort((a, b) => String(a).localeCompare(String(b), 'he'));
  const setCond = (i, patch) => setConditions(conditions.map((c, j) => j === i ? { ...c, ...patch } : c));

  return (
    <div className="slice">
      <button className={`toggle ${active ? 'on' : ''}`} onClick={() => setOpen(!open)}>חיתוך נתונים{active ? ` (${active})` : ''}</button>
      {open && (
        <div className="slice-panel">
          <p className="slice-help">בחרי עמודה וערך. לדוגמה: מתחם "החוף האינטנסיבי" וסביבה "טוב". כל התנאים חלים יחד.</p>
          {conditions.map((c, i) => {
            const col = columns.find(x => x.key === c.col);
            return (
              <div className="slice-row" key={i}>
                <select value={c.col} onChange={e => setCond(i, { col: e.target.value, val: '' })} aria-label="עמודה">
                  <option value="">בחרי עמודה</option>
                  {columns.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
                </select>
                {col && col.kind === 'text' && <input value={c.val} onChange={e => setCond(i, { val: e.target.value })} placeholder="מילה לחיפוש" />}
                {col && col.kind !== 'text' && (
                  <select value={c.val} onChange={e => setCond(i, { val: e.target.value })} aria-label="ערך">
                    <option value="">בחרי ערך</option>
                    {optionsOf(col).map(o => <option key={o} value={o}>{col.display ? col.display(o) : o}</option>)}
                  </select>
                )}
                <button className="ghost" onClick={() => setConditions(conditions.filter((_, j) => j !== i))} aria-label="הסרת תנאי">הסרה</button>
              </div>
            );
          })}
          <div className="slice-foot">
            <button onClick={() => setConditions([...conditions, { col: '', val: '' }])}>הוספת תנאי</button>
            <button onClick={() => setConditions([])}>ניקוי הכול</button>
            <button className="primary" onClick={() => setOpen(false)}>סגירה</button>
          </div>
        </div>
      )}
    </div>
  );
}
