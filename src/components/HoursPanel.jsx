import { useMemo, useState, useEffect } from 'react';
import { parseHours, isOpenAt, hourLabel, PERMIT } from '../utils/hours.js';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function readHour() {
  const h = Number(new URLSearchParams(window.location.search).get('h'));
  if (Number.isFinite(h) && h >= 0 && h < 24 && new URLSearchParams(window.location.search).has('h')) return h;
  const now = new Date();
  return now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0);
}

// Hour state plus who is open at that hour. Shared by the panel and the map markers.
export function useHoursView(positions) {
  const [hour, setHourState] = useState(readHour);
  const setHour = (h) => {
    setHourState(h);
    const url = new URL(window.location.href);
    url.searchParams.set('h', String(h));
    window.history.replaceState(null, '', url.pathname + url.search);
  };
  const rangesById = useMemo(() => Object.fromEntries(positions.map(p => [p.id, parseHours(p.openingHours)])), [positions]);
  const openById = useMemo(() => Object.fromEntries(positions.map(p => [p.id, isOpenAt(rangesById[p.id], hour)])), [positions, rangesById, hour]);
  const perHour = useMemo(() => HOURS.map(h => positions.filter(p => isOpenAt(rangesById[p.id], h + 0.25)).length), [positions, rangesById]);
  return { hour, setHour, openById, rangesById, perHour };
}

function PermitChip({ state }) {
  const t = PERMIT[state.tone];
  return (
    <span className={`permit-chip ${state.tone}`}>
      <i style={{ background: t.color }} />
      {t.label}
      {state.date && <span className="mono-value">{state.date.toLocaleDateString('he-IL')}</span>}
    </span>
  );
}

export default function HoursPanel({ positions, hours, permitById, openCard }) {
  const { hour, setHour, openById, perHour } = hours;
  const [pulse, setPulse] = useState(false);
  useEffect(() => { setPulse(true); const t = setTimeout(() => setPulse(false), 220); return () => clearTimeout(t); }, [hour]);

  const groups = useMemo(() => {
    const g = { open: [], closed: [], unknown: [] };
    positions.forEach(p => g[openById[p.id] === true ? 'open' : openById[p.id] === false ? 'closed' : 'unknown'].push(p));
    return g;
  }, [positions, openById]);
  const permitCounts = useMemo(() => positions.reduce((m, p) => { const t = permitById[p.id]?.tone || 'unknown'; m[t] = (m[t] || 0) + 1; return m; }, {}), [positions, permitById]);

  const total = positions.length;
  const withHours = total - groups.unknown.length;
  const withDate = total - (permitCounts.unknown || 0);
  const maxPerHour = Math.max(1, ...perHour);
  const label = hourLabel(hour);

  return (
    <div className="hours-panel">
      <p className="hours-purpose">המפה מראה אילו עמדות פתוחות בשעה שנבחרה ואיפה הן, וצבע כל סמן אומר אם רישיון העסק שלה בתוקף.</p>

      <div className="hours-control">
        <div className="hours-readout">
          <span className="mono-label">שעה נבחרת</span>
          <strong className={`hours-value${pulse ? ' pulse' : ''}`} aria-live="polite">{label}</strong>
        </div>
        <div className="hours-track">
          <div className="hours-bars" aria-hidden="true">
            {perHour.map((n, h) => (
              <span key={h} className={`hours-bar${Math.floor(hour) === h ? ' on' : ''}`} style={{ height: `${Math.max(6, (n / maxPerHour) * 100)}%` }} data-empty={n === 0 || undefined} />
            ))}
          </div>
          <input
            type="range"
            className="hours-slider"
            min="0"
            max="23.5"
            step="0.5"
            value={hour}
            onChange={e => setHour(Number(e.target.value))}
            aria-label="בחירת שעה ביום"
            aria-valuetext={label}
          />
          <div className="hours-ticks" aria-hidden="true">
            {[0, 3, 6, 9, 12, 15, 18, 21].map(h => <span key={h} className={h % 6 ? 'minor' : undefined} style={{ insetInlineStart: `${(h / 23.5) * 100}%` }}>{hourLabel(h)}</span>)}
          </div>
        </div>
        <button className="btn" onClick={() => { const n = new Date(); setHour(n.getHours() + (n.getMinutes() >= 30 ? 0.5 : 0)); }}>עכשיו</button>
      </div>

      <div className="hours-summary">
        <div className="hours-stat">
          <span className="mono-label">פתוחות ב-{label}</span>
          <strong>{groups.open.length}</strong>
          <span className="hours-stat-line">
            {withHours ? `מתוך ${withHours} עמדות שיש להן שעות רשומות.` : 'אי אפשר לדעת: לאף עמדה אין עדיין שעות פעילות רשומות.'}
          </span>
        </div>
        <div className="hours-stat">
          <span className="mono-label">בלי שעות רשומות</span>
          <strong>{groups.unknown.length}</strong>
          <span className="hours-stat-line">מתוך {total} עמדות. הן מסומנות בטבעת מקווקוות ולא נספרות כפתוחות.</span>
        </div>
        <div className="hours-stat">
          <span className="mono-label">רישיון עם תאריך תוקף</span>
          <strong>{withDate}</strong>
          <span className="hours-stat-line">
            {withDate ? `${permitCounts.expired || 0} פגו, ${permitCounts.soon || 0} פגים בתוך 30 יום, ${permitCounts.valid || 0} בתוקף.` : 'ברישיון העסק רשום רק "יש", בלי תאריך, ולכן כל הסמנים אפורים.'}
          </span>
        </div>
      </div>

      {(groups.unknown.length > 0 || withDate < total) && (
        <div className="hours-missing" role="note">
          <span className="mono-label">חסר מידע כדי שהמפה תענה</span>
          <ul>
            {groups.unknown.length > 0 && <li><strong>שעות פעילות</strong> לכל עמדה (למשל 10:00-23:00). חסר ב-{groups.unknown.length} עמדות.</li>}
            {withDate < total && <li><strong>תאריך תוקף לרישיון העסק</strong>. חסר ב-{total - withDate} עמדות.</li>}
          </ul>
          <p>שני השדות האלה עדיין לא קיימים בכרטיס העמדה. כשיתווספו, המפה תתמלא מעצמה.</p>
        </div>
      )}

    </div>
  );
}

export function HoursList({ positions, hours, permitById, openCard }) {
  const { hour, openById } = hours;
  const label = hourLabel(hour);
  const groups = { open: [], closed: [], unknown: [] };
  positions.forEach(p => groups[openById[p.id] === true ? 'open' : openById[p.id] === false ? 'closed' : 'unknown'].push(p));
  return (
    <div className="hours-list">
      {[['open', `פתוחות ב-${label}`], ['closed', 'סגורות בשעה הזו'], ['unknown', 'אין שעות רשומות']].map(([key, title]) => groups[key].length > 0 && (
        <section key={key} className={`hours-group ${key}`}>
          <h3><span className="mono-label">{title}</span> <span className="mono-value">{groups[key].length}</span></h3>
          <ul>
            {groups[key].map(p => (
              <li key={p.id}>
                <button className="hours-row" onClick={() => openCard(p.id)}>
                  <span className="mono-value">{p.number}</span>
                  <span className="hours-row-name">{p.positionName || 'עמדה'}</span>
                  {p.openingHours && <span className="mono-value hours-row-time">{p.openingHours}</span>}
                  <PermitChip state={permitById[p.id]} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
