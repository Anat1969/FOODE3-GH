import { useState, useRef, useEffect } from 'react';

// One search for the whole app: positions and agreements, results open in place.
const has = (q, ...vals) => vals.some(v => String(v ?? '').toLowerCase().includes(q));

export default function GlobalSearch({ positions, trucks, openCard, openTrucks }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef(null);
  const term = q.trim().toLowerCase();

  useEffect(() => {
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const posHits = term ? positions.filter(p => has(term, p.number, p.positionName, p.complexName, p.businessName, p.ownerName, p.developerName, p.notes)).slice(0, 8) : [];
  const truckHits = term ? trucks.filter(t => has(term, t.number, t.owner_name, t.business_label, t.location, t.phone, t.status)).slice(0, 6) : [];
  const items = [
    ...posHits.map(p => ({ id: `p-${p.id}`, kind: 'עמדה', title: p.positionName || `עמדה ${p.number}`, sub: [p.complexName, p.businessName].filter(Boolean).join(' · '), go: () => openCard(p.id) })),
    ...truckHits.map(t => ({ id: `t-${t.id}`, kind: 'הסכם', title: t.owner_name || `הסכם ${t.number}`, sub: [t.business_label, t.location].filter(Boolean).join(' · '), go: () => openTrucks(t.owner_name || q) })),
  ];

  const pick = (it) => { it.go(); setOpen(false); setQ(''); };
  const onKey = (e) => {
    if (e.key === 'Escape') { setOpen(false); e.currentTarget.blur(); return; }
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % items.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + items.length) % items.length); }
    if (e.key === 'Enter') { e.preventDefault(); pick(items[Math.min(active, items.length - 1)]); }
  };

  return (
    <div className="global-search" ref={box}>
      <input
        type="search"
        value={q}
        placeholder="חיפוש עמדה או עסק"
        aria-label="חיפוש בכל האפליקציה"
        aria-expanded={open && Boolean(term)}
        aria-controls="global-search-results"
        role="combobox"
        onFocus={() => setOpen(true)}
        onChange={e => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKey}
      />
      {open && term && (
        <ul className="global-results" id="global-search-results" role="listbox">
          {items.length === 0 && <li className="global-empty">אין תוצאות</li>}
          {items.map((it, i) => (
            <li key={it.id} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? 'active' : ''} onMouseEnter={() => setActive(i)} onClick={() => pick(it)}>
                <span className={`global-kind ${it.kind === 'עמדה' ? 'pos' : 'truck'}`}>{it.kind}</span>
                <strong>{it.title}</strong>
                {it.sub && <span className="global-sub">{it.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
