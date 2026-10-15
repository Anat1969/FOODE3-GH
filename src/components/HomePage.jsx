import { motion } from 'framer-motion';
import { approvalTone, harmonicaTone } from '../utils/colors.js';

const SECTIONS = [
  ['list', 'רשימת עמדות', 'כל העמדות בטבלה אחת, עם מיון, חיפוש וכרטיס מלא לכל עמדה'],
  ['map', 'מפת עמדות', 'מפת לוויין של אשדוד. לחיצה על סמן פותחת את כרטיס העמדה'],
  ['report', 'דוח לטיפול', 'מה חסר בכל עמדה: תשתיות, מבנה וסביבה'],
  ['examples', 'דוגמאות', 'דוגמאות טובות ורעות לעיצוב עמדה'],
  ['links', 'קישורים', 'מצגות, מחברות וכלים נלווים'],
  ['policy', 'מדיניות', 'מסמך המדיניות העירוני לעמדות מזון נייד'],
];

const rise = (i) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] },
});

export default function HomePage({ positions, events, go, openCard, filterTo }) {
  const total = positions.length;
  const count = (fn) => positions.filter(fn).length;
  const approved = count(p => p.approval === 'מיקום מקובל');
  const pending = count(p => p.approval === 'בבדיקה');
  const rejected = count(p => p.approval === 'מיקום לא מקובל');
  const harmonicaWaiting = positions.filter(p => p.harmonicaStatus === 'הוגשה');
  const openCorrections = events.filter(e => e.kind === 'correction' && !e.resolved);
  const correctionsBy = openCorrections.reduce((m, e) => ({ ...m, [e.position_id]: (m[e.position_id] || 0) + 1 }), {});
  const needsAttention = positions
    .filter(p => p.harmonicaStatus === 'הוגשה' || correctionsBy[p.id])
    .slice(0, 8);

  const complexes = Object.entries(positions.reduce((m, p) => {
    const key = p.complexName || 'ללא מתחם';
    m[key] = m[key] || { total: 0, green: 0, orange: 0, red: 0 };
    m[key].total++;
    const tone = approvalTone(p.approval);
    if (m[key][tone] !== undefined) m[key][tone]++;
    return m;
  }, {})).sort((a, b) => b[1].total - a[1].total);

  const stats = [
    { label: 'עמדות', value: total, onClick: () => filterTo('all') },
    { label: 'מיקום מקובל', value: approved, tone: 'green', onClick: () => filterTo('approved') },
    { label: 'בבדיקה', value: pending, tone: 'orange', onClick: () => filterTo('pending') },
    { label: 'לא מקובל', value: rejected, tone: 'red', onClick: () => filterTo('rejected') },
    { label: 'הרמוניקה ממתינה לאישור', value: harmonicaWaiting.length, tone: 'blue', onClick: () => filterTo('harmonica') },
    { label: 'הערות פתוחות', value: openCorrections.length, tone: 'orange' },
  ];

  return (
    <div className="home">
      <section className="home-hero">
        <motion.span className="mono-label" {...rise(0)}>עיריית אשדוד · מזון נייד</motion.span>
        <motion.h1 {...rise(1)}>עמדות הפודטראק של אשדוד</motion.h1>
        <motion.p {...rise(2)}>
          {total} עמדות ב-{complexes.length} מתחמים. כל עמדה עם כרטיס מלא: פרטים, תשתיות, הרמוניקה, מסמכים והיסטוריה.
        </motion.p>
        <motion.div className="home-cta" {...rise(3)}>
          <button className="btn primary large" onClick={() => go('list')}>לרשימת העמדות</button>
          <button className="btn large" onClick={() => go('map')}>למפה</button>
        </motion.div>
      </section>

      <section className="home-stats">
        {stats.map((s, i) => (
          <motion.button
            key={s.label}
            className={`stat-tile ${s.tone || ''}`}
            onClick={s.onClick}
            disabled={!s.onClick}
            whileHover={s.onClick ? { y: -3 } : undefined}
            {...rise(4 + i)}
          >
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </motion.button>
        ))}
      </section>

      <div className="home-columns">
        <section className="panel home-block">
          <h2>דורש טיפול</h2>
          {needsAttention.length === 0 ? <p className="card-empty">אין כרגע הרמוניקות ממתינות או הערות פתוחות.</p> : (
            <ul className="attention-list">
              {needsAttention.map(p => (
                <li key={p.id}>
                  <button onClick={() => openCard(p.id, 'harmonica')}>
                    <span className="mono-label">עמדה {p.number}</span>
                    <strong>{p.positionName}</strong>
                    <span className={`pill ${harmonicaTone(p.harmonicaStatus)}`}>{p.harmonicaStatus}</span>
                    {correctionsBy[p.id] ? <span className="pill orange">{correctionsBy[p.id]} הערות פתוחות</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel home-block">
          <h2>מתחמים</h2>
          <ul className="complex-list">
            {complexes.map(([name, c]) => (
              <li key={name}>
                <button onClick={() => filterTo(`complex:${name}`)}>
                  <span className="complex-name">{name}</span>
                  <span className="complex-bar" aria-hidden="true">
                    <i className="green" style={{ flex: c.green }} />
                    <i className="orange" style={{ flex: c.orange }} />
                    <i className="red" style={{ flex: c.red }} />
                  </span>
                  <span className="mono-label">{c.total} עמדות</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="home-sections">
        {SECTIONS.map(([id, title, desc], i) => (
          <motion.button key={id} className="section-tile" onClick={() => go(id)} whileHover={{ y: -4 }} {...rise(10 + i)}>
            <span className="mono-label">0{i + 1}</span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </motion.button>
        ))}
      </section>

      <footer className="home-footer">עיריית אשדוד · ניהול עמדות מזון נייד · {new Date().getFullYear()}</footer>
    </div>
  );
}
