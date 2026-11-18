import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APPROVAL_OPTIONS, BUILDING_OPTIONS, ENV_OPTIONS, approvalTone, qualityTone, withCurrent } from '../utils/colors.js';
import { isPinned } from './PositionCard.jsx';

// The report is computed from the data: every open item is a field that still needs work.
// Resolving an item writes to the same fields the table shows, so the item leaves the report.

const INFRA = [['water', 'מים'], ['electricity', 'חשמל'], ['sewage', 'ביוב']];
const BAD_BUILDING = ['מבנה לא מקובל', 'אין מבנה', 'לא טוב'];
const BAD_ENV = ['אזהרה', 'טעון שיפור', 'לא טוב'];

function buildCategories(positions, openCorrectionsById) {
  const cats = [
    { id: 'infra', title: 'תשתיות', items: [] },
    { id: 'quality', title: 'מבנה וסביבה', items: [] },
    { id: 'approval', title: 'אישור מיקום', items: [] },
    { id: 'harmonica', title: 'הרמוניקה', items: [] },
    { id: 'details', title: 'פרטים חסרים', items: [] },
  ];
  const at = Object.fromEntries(cats.map(c => [c.id, c.items]));
  for (const p of positions) {
    for (const [field, name] of INFRA) {
      if (p[field] === 'לא טוב') at.infra.push({ key: `${p.id}:${field}`, p, label: `חיבור ${name}`, kind: 'check', field, done: 'טוב' });
    }
    if (BAD_BUILDING.includes(p.buildingQuality)) at.quality.push({ key: `${p.id}:building`, p, label: 'עיצוב המבנה', kind: 'select', field: 'buildingQuality', options: BUILDING_OPTIONS, tone: qualityTone });
    if (BAD_ENV.includes(p.environmentQuality)) at.quality.push({ key: `${p.id}:env`, p, label: 'איכות הסביבה', kind: 'select', field: 'environmentQuality', options: ENV_OPTIONS, tone: qualityTone });
    if (p.approval !== 'מיקום מקובל') at.approval.push({ key: `${p.id}:approval`, p, label: 'סטטוס מיקום', kind: 'select', field: 'approval', options: APPROVAL_OPTIONS, tone: approvalTone });
    const corrections = openCorrectionsById[p.id] || 0;
    if (p.harmonicaStatus === 'הוגשה') at.harmonica.push({ key: `${p.id}:harm`, p, label: 'אישור ההרמוניקה', kind: 'approve' });
    else if (p.harmonicaStatus === 'נדרש תיקון' || corrections) at.harmonica.push({ key: `${p.id}:fix`, p, label: corrections === 1 ? 'הערה אחת לתיקון פתוחה' : corrections ? `${corrections} הערות לתיקון פתוחות` : 'נדרש תיקון', kind: 'open', tab: 'harmonica' });
    else if (!p.harmonicaStatus || p.harmonicaStatus === 'לא הוגשה') at.harmonica.push({ key: `${p.id}:upload`, p, label: 'העלאת הרמוניקה', kind: 'open', tab: 'harmonica' });
    if (!p.developerName) at.details.push({ key: `${p.id}:devname`, p, label: 'שם היזם', kind: 'text', field: 'developerName' });
    if (!p.developerEmail) at.details.push({ key: `${p.id}:devmail`, p, label: 'דוא"ל היזם', kind: 'text', field: 'developerEmail', type: 'email' });
    if (!p.foodTruckImageUrl) at.details.push({ key: `${p.id}:img`, p, label: 'תמונה', kind: 'open', tab: 'details' });
    if (!isPinned(p.mapPin)) at.details.push({ key: `${p.id}:pin`, p, label: 'מיקום על המפה', kind: 'pin' });
  }
  const byNumber = (a, b) => (Number(a.p.number) || 0) - (Number(b.p.number) || 0);
  cats.forEach(c => c.items.sort(byNumber));
  return cats;
}

function TextFix({ item, onSave }) {
  const [draft, setDraft] = useState('');
  const commit = () => { const v = draft.trim(); if (v) onSave(v); };
  return (
    <input
      className="inline-field boxed fix-input"
      type={item.type || 'text'}
      dir={item.type === 'email' ? 'ltr' : undefined}
      placeholder={item.label}
      aria-label={`${item.label} לעמדה ${item.p.number}`}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export default function ActionReportPage({ positions, openCorrectionsById = {}, update, changeApproval, approveHarmonica, openCard, startPin, canEdit }) {
  const [open, setOpen] = useState(() => new Set());
  const [handled, setHandled] = useState([]); // resolved in this visit, kept visible with a strike-through and undo
  const categories = useMemo(() => buildCategories(positions, openCorrectionsById), [positions, openCorrectionsById]);
  const total = categories.reduce((s, c) => s + c.items.length, 0);

  // Printing shows every category open.
  useEffect(() => {
    const before = () => setOpen(new Set(categories.map(c => c.id)));
    window.addEventListener('beforeprint', before);
    return () => window.removeEventListener('beforeprint', before);
  }, [categories]);

  const toggle = (id) => setOpen(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const remember = (item, cat, revert) => setHandled(h => [...h.filter(x => x.key !== item.key), { key: item.key, cat, label: item.label, p: item.p, revert }]);

  const resolve = (item, cat, value) => {
    const prev = item.p[item.field];
    if (item.field === 'approval') changeApproval(item.p.id, value);
    else update(item.p.id, { [item.field]: value });
    // Only a value that clears the item is shown as handled.
    const stillOpen = buildCategories([{ ...item.p, [item.field]: value }], openCorrectionsById)
      .find(c => c.id === cat)?.items.some(i => i.key === item.key);
    if (!stillOpen) remember(item, cat, () => (item.field === 'approval' ? changeApproval(item.p.id, prev) : update(item.p.id, { [item.field]: prev })));
  };

  const undo = (h) => {
    h.revert?.();
    setHandled(list => list.filter(x => x.key !== h.key));
  };

  return (
    <section className="action-report report-v2">
      <div className="report-head">
        <h2>דוח לטיפול</h2>
        <span className="mono-label">{total} פריטים פתוחים</span>
        <button type="button" className="btn small print-btn" onClick={() => { setOpen(new Set(categories.map(c => c.id))); setTimeout(() => window.print(), 50); }}>הדפסה</button>
      </div>

      <div className="report-cats">
        {categories.map(cat => {
          const isOpen = open.has(cat.id);
          const done = handled.filter(h => h.cat === cat.id);
          const all = cat.items.length + done.length;
          return (
            <div key={cat.id} className={`report-cat ${isOpen ? 'open' : ''} ${cat.items.length ? '' : 'clear'}`}>
              <button type="button" className="report-cat-head" aria-expanded={isOpen} onClick={() => toggle(cat.id)}>
                <span className="report-cat-title">{cat.title}</span>
                <span className="report-cat-count">{cat.items.length}</span>
                <span className="report-cat-bar" aria-hidden="true">
                  <i style={{ width: `${all ? (done.length / all) * 100 : 100}%` }} />
                </span>
                <span className="report-cat-chevron" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="report-cat-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    {cat.items.length === 0 && done.length === 0 && <p className="card-empty">אין פריטים פתוחים</p>}
                    <ul className="fix-list">
                      {cat.items.map(item => (
                        <li key={item.key} className="fix-row">
                          {item.kind === 'check' || item.kind === 'approve' ? (
                            <input
                              type="checkbox"
                              className="fix-check"
                              aria-label={`${item.label} טופל, עמדה ${item.p.number}`}
                              disabled={!canEdit}
                              checked={false}
                              onChange={() => {
                                if (item.kind === 'approve') {
                                  approveHarmonica(item.p.id, true);
                                  remember(item, cat.id, () => approveHarmonica(item.p.id, false));
                                } else resolve(item, cat.id, item.done);
                              }}
                            />
                          ) : <span className="fix-check-space" />}
                          <button type="button" className="fix-pos" onClick={() => openCard(item.p.id, item.tab || 'details')}>
                            <span className="mono-label">{item.p.number}</span> {item.p.positionName}
                          </button>
                          <span className="fix-label">{item.label}</span>
                          <span className="fix-control">
                            {item.kind === 'select' && (canEdit ? (
                              <select className={`pill-select tone-${item.tone(item.p[item.field])}`} value={item.p[item.field] || ''} onChange={e => resolve(item, cat.id, e.target.value)}>
                                {withCurrent(item.options, item.p[item.field]).map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : <span className={`pill ${item.tone(item.p[item.field])}`}>{item.p[item.field]}</span>)}
                            {item.kind === 'text' && canEdit && <TextFix item={item} onSave={v => resolve(item, cat.id, v)} />}
                            {item.kind === 'open' && <button type="button" className="btn small" onClick={() => openCard(item.p.id, item.tab)}>פתיחה</button>}
                            {item.kind === 'pin' && canEdit && <button type="button" className="btn small" onClick={() => startPin(item.p.id)}>סימון</button>}
                          </span>
                        </li>
                      ))}
                      {done.map(h => (
                        <li key={h.key} className="fix-row handled">
                          <input type="checkbox" className="fix-check" checked aria-label={`ביטול: ${h.label}, עמדה ${h.p.number}`} onChange={() => undo(h)} />
                          <span className="fix-pos"><span className="mono-label">{h.p.number}</span> {h.p.positionName}</span>
                          <span className="fix-label">{h.label}</span>
                          <span className="fix-control" />
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
