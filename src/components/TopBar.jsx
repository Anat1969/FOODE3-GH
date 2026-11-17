import { useState } from 'react';

export default function TopBar({ page, setPage, lastSaved, editMode, setEditMode }) {
  const [open, setOpen] = useState(false);
  const tabs = [
    ['list', 'רשימת עמדות'],
    ['trucks', 'פודטראקים'],
    ['map', 'מפת עמדות'],
    ['reports', 'דוחות'],
    ['settings', 'הגדרות']
  ];
  const act = (fn) => () => { fn(); setOpen(false); };
  return (
    <header className="topbar glass-panel">
      <div className="top-line">
        <div className="ai-menu-wrap">
          <button className="ai-menu" aria-label="תפריט פעולות" title="תפריט פעולות: עריכה והגדרות" onClick={() => setOpen(!open)}>פ</button>
          {open && (
            <div className="ai-menu-list">
              <button onClick={act(() => setEditMode(!editMode))}>{editMode ? 'מעבר למצב תצוגה' : 'מעבר למצב עריכה'}</button>
              <button onClick={act(() => setPage('settings'))}>הגדרות</button>
            </div>
          )}
        </div>
        <button className="brand" onClick={() => setPage('list')}>מערכת ניהול עמדות פודטראק – אשדוד</button>
        <div className="save-indicator"><span className="dot green" /> נשמר בזמן אמת {lastSaved && `· ${lastSaved}`} · {editMode ? 'מצב עריכה' : 'מצב תצוגה'}</div>
      </div>
      <div className="tabs-row">
        <nav className="tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{label}</button>
          ))}
        </nav>
      </div>
    </header>
  );
}
