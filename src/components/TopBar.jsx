import { useState } from 'react';

const REPO_URL = 'https://github.com/Anat1969/FOODE3-GH';
const LIVE_URL = 'https://anat1969.github.io/FOODE3-GH/';

export default function TopBar({ page, setPage, lastSaved, editMode, setEditMode, query, setQuery, found }) {
  const [open, setOpen] = useState(false);
  const tabs = [
    ['home', 'דף פתיחה'],
    ['list', 'רשימת עמדות'],
    ['trucks', 'פודטראקים'],
    ['map', 'מפת עמדות'],
    ['reports', 'דוחות'],
  ];
  const act = (fn) => () => { fn(); setOpen(false); };
  return (
    <header className="topbar glass-panel">
      <div className="top-line">
        <div className="ai-menu-wrap">
          <button className="ai-menu" aria-label="תפריט" title="תפריט: עריכה, הגדרות וכתובת פיתוח" onClick={() => setOpen(!open)}>פ</button>
          {open && (
            <div className="ai-menu-list">
              <button onClick={act(() => setEditMode(!editMode))}>{editMode ? 'מעבר למצב תצוגה' : 'מעבר למצב עריכה'}</button>
              <button onClick={act(() => setPage('settings'))}>הגדרות</button>
              <a href={REPO_URL} target="_blank" rel="noreferrer">כתובת הפיתוח (GitHub)</a>
              <a href={LIVE_URL} target="_blank" rel="noreferrer">כתובת האפליקציה</a>
            </div>
          )}
        </div>
        <button className="brand" onClick={() => setPage('home')}>מערכת ניהול עמדות פודטראק – אשדוד</button>
        <div className="search-box">
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש לפי שם, מתחם, עסק או טלפון" aria-label="חיפוש בכל הדפים" />
          {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="ניקוי חיפוש">ניקוי</button>}
        </div>
        <div className="save-indicator"><span className="dot green" /> נשמר · {lastSaved} · {editMode ? 'עריכה' : 'תצוגה'}</div>
      </div>
      <div className="tabs-row">
        <nav className="tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{label}</button>
          ))}
        </nav>
        {found !== null && <span className="found-line">נמצאו {found} תוצאות לחיפוש "{query}" בכל הדפים</span>}
      </div>
    </header>
  );
}
