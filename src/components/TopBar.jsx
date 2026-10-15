import { useState, useEffect, useRef } from 'react';

export const DEV_CHAT_URL = 'https://claude.ai/code/session_01ELjmgCtCVbBT1AstY1Wrrk';

const DEFAULT_TABS = [
  ['list', 'רשימת עמדות'],
  ['map', 'מפת עמדות'],
  ['report', 'דוח לטיפול'],
  ['examples', 'דוגמאות'],
  ['links', 'קישורים'],
  ['policy', 'מדיניות'],
  ['settings', 'הגדרות'],
];

const ORDER_KEY = 'foode3-tab-order';

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* ignore */ }
  return null;
}

function SaveIndicator({ saveState, editor }) {
  if (!editor) return <span className="save-indicator"><i className="dot gray" />תצוגה בלבד</span>;
  if (saveState.error) return <span className="save-indicator error"><i className="dot red" />השמירה נכשלה</span>;
  if (saveState.pending) return <span className="save-indicator"><i className="dot orange" />שומר…</span>;
  return (
    <span className="save-indicator">
      <i className="dot green" />נשמר{saveState.at ? ` ${saveState.at.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` : ''}
    </span>
  );
}

export default function TopBar({ page, go, editor, editMode, setEditMode, saveState, onCopyLink, canInstall, onInstall }) {
  const [tabOrder, setTabOrder] = useState(() => loadOrder() || DEFAULT_TABS.map(t => t[0]));
  const [dragId, setDragId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(tabOrder)); } catch { /* ignore */ }
  }, [tabOrder]);

  // Exposes the bar height so cards and overlays open below it.
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--topbar-h', `${Math.ceil(entry.target.getBoundingClientRect().height)}px`);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const allTabs = [
    ...tabOrder.map(id => DEFAULT_TABS.find(t => t[0] === id)).filter(Boolean),
    ...DEFAULT_TABS.filter(t => !tabOrder.includes(t[0])),
  ];
  const canDrag = editor && editMode;

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    setTabOrder(prev => {
      const order = allTabs.map(t => t[0]);
      const from = order.indexOf(dragId);
      const to = order.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      order.splice(from, 1);
      order.splice(to, 0, dragId);
      return order;
    });
    setDragId(null);
  };

  return (
    <header className="topbar" ref={ref}>
      <div className="topbar-row">
        <a
          className="brand"
          href="/"
          onClick={e => { e.preventDefault(); go('home'); }}
          title="דף הבית"
        >
          <img src="/icon-192.png" alt="" className="brand-mark" width="32" height="32" />
          <span className="brand-text">
            <span className="brand-name">פודטראק אשדוד</span>
            <span className="brand-sub">ניהול עמדות</span>
          </span>
        </a>
        <div className="topbar-tools">
          <SaveIndicator saveState={saveState} editor={editor} />
          {editor && (
            <button className={`btn small ${editMode ? 'primary' : ''}`} onClick={() => setEditMode(!editMode)} title="עריכה ישירה בטבלה">
              {editMode ? 'מצב עריכה' : 'מצב תצוגה'}
            </button>
          )}
          <button className="btn small" onClick={onCopyLink}>העתקת קישור</button>
          <a className="btn small" href={DEV_CHAT_URL} target="_blank" rel="noreferrer">שיחת הפיתוח</a>
          {canInstall && <button className="btn small" onClick={onInstall}>התקנת האפליקציה</button>}
        </div>
      </div>
      <nav className="tabs" aria-label="ניווט ראשי">
        {allTabs.map(([id, label]) => (
          <button
            key={id}
            className={page === id ? 'active' : ''}
            aria-current={page === id ? 'page' : undefined}
            onClick={() => go(id)}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; } : undefined}
            onDragOver={canDrag ? (e) => e.preventDefault() : undefined}
            onDrop={canDrag ? (e) => handleDrop(e, id) : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
