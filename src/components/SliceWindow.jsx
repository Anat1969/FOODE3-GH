import { useState, useRef, useEffect } from 'react';

// One window for slicing data: each condition is a column and a value, and all conditions apply together.
// columns: [{ key, label, kind: 'select' | 'text', value?: row => string, display?: v => string }]
export function applyConditions(rows, conditions, columns) {
  const live = conditions.filter(c => c.col && c.val);
  if (!live.length) return rows;
  return rows.filter(r => live.every(c => {
    const col = columns.find(x => x.key === c.col);
    if (!col) return true;
    const v = String((col.value ? col.value(r) : r[c.col]) ?? '');
    return col.kind === 'text' ? v.toLowerCase().includes(c.val.trim().toLowerCase()) : v === c.val;
  }));
}

export default function SliceWindow({ columns, rows, conditions, setConditions }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const active = conditions.filter(c => c.col && c.val).length;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const optionsOf = (col) => [...new Set(rows.map(r => (col.value ? col.value(r) : r[col.key])).filter(v => v !== '' && v != null))]
    .map(String).sort((a, b) => a.localeCompare(b, 'he'));
  const setCond = (i, patch) => setConditions(conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const shown = conditions.length ? conditions : [{ col: '', val: '' }];

  return (
    <div className="slice" ref={box}>
      <button type="button" className={`chip-toggle ${active ? 'on' : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        חיתוך נתונים{active ? ` · ${active}` : ''}
      </button>
      {open && (
        <div className="slice-panel" role="dialog" aria-label="חיתוך נתונים">
          {shown.map((c, i) => {
            const col = columns.find(x => x.key === c.col);
            return (
              <div className="slice-row" key={i}>
                <select className="filter-input" value={c.col} aria-label="עמודה"
                  onChange={e => (conditions.length ? setCond(i, { col: e.target.value, val: '' }) : setConditions([{ col: e.target.value, val: '' }]))}>
                  <option value="">עמודה</option>
                  {columns.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
                </select>
                {col?.kind === 'text' && <input className="filter-input" value={c.val} placeholder="מילה" aria-label="ערך" onChange={e => setCond(i, { val: e.target.value })} />}
                {col && col.kind !== 'text' && (
                  <select className="filter-input" value={c.val} aria-label="ערך" onChange={e => setCond(i, { val: e.target.value })}>
                    <option value="">ערך</option>
                    {optionsOf(col).map(o => <option key={o} value={o}>{col.display ? col.display(o) : o}</option>)}
                  </select>
                )}
                {!col && <span />}
                <button type="button" className="icon-btn" aria-label="הסרת תנאי" title="הסרה" onClick={() => setConditions(conditions.filter((_, j) => j !== i))}>×</button>
              </div>
            );
          })}
          <div className="slice-foot">
            <button type="button" className="icon-btn add" aria-label="הוספת תנאי" title="הוספת תנאי" onClick={() => setConditions([...(conditions.length ? conditions : shown), { col: '', val: '' }])}>+</button>
            {active > 0 && <button type="button" className="text-button" onClick={() => setConditions([])}>ניקוי</button>}
          </div>
        </div>
      )}
    </div>
  );
}
