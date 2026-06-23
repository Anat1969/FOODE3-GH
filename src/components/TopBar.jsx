import { useState, useEffect } from 'react';

const DEFAULT_TABS = [
  ['list', 'רשימת עמדות'],
  ['map', 'מפת עמדות'],
  ['report', 'דוח לטיפול'],
  ['examples', 'דוגמאות'],
  ['links', 'קישורים'],
  ['policy', '📜 מדיניות'],
];

const ORDER_KEY = 'foode3-tab-order';

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  return null;
}

export default function TopBar({ page, setPage, lastSaved, editMode, setEditMode, onShowPolicy }) {
  const [tabOrder, setTabOrder] = useState(() => loadOrder() || DEFAULT_TABS.map(t => t[0]));
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(tabOrder));
  }, [tabOrder]);

  const orderedTabs = tabOrder
    .map(id => DEFAULT_TABS.find(t => t[0] === id))
    .filter(Boolean);

  const missingTabs = DEFAULT_TABS.filter(t => !tabOrder.includes(t[0]));
  const allTabs = [...orderedTabs, ...missingTabs];

  const handleTabClick = (id) => {
    setPage(id);
  };

  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    setTabOrder(prev => {
      const order = [...prev];
      const fromIdx = order.indexOf(dragId);
      const toIdx = order.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, dragId);
      return order;
    });
    setDragId(null);
  };

  return (
    <header className="topbar glass-panel">
      <div className="top-line">
        <div className="userbox">
          <button className="icon-button" aria-label="תפריט">☰</button>
          <div className="avatar">●</div>
          <span>שלום, מנהל מערכת</span>
        </div>
        <h1 className="topbar-logo" onClick={() => setPage('landing')} title="חזרה לדף הבית">מערכת ניהול עמדות פודטראק – אשדוד</h1>
        <div className="save-indicator"><span className="dot green" /> נשמר בזמן אמת {lastSaved && `· ${lastSaved}`}</div>
        <div className="traffic-lights"><i/><i/><i/></div>
      </div>
      <div className="tabs-row">
        <nav className="tabs">
          {allTabs.map(([id, label]) => (
            <button
              key={id}
              className={`${(id === 'policy' ? false : page === id) ? 'active' : ''} ${id === 'policy' ? 'policy-tab' : ''}`}
              onClick={() => handleTabClick(id)}
              draggable={editMode}
              onDragStart={editMode ? (e) => handleDragStart(e, id) : undefined}
              onDragOver={editMode ? handleDragOver : undefined}
              onDrop={editMode ? (e) => handleDrop(e, id) : undefined}
              style={editMode ? { cursor: 'grab' } : undefined}
            >
              {editMode && <span className="drag-hint">⠿</span>}
              {label}
            </button>
          ))}
        </nav>
        <div className="tabs-actions">
          <button className={`edit-toggle ${editMode ? 'active' : ''}`} onClick={() => setEditMode(!editMode)}>
            {editMode ? '✏️ מצב עריכה' : '👁️ מצב תצוגה'}
          </button>
        </div>
      </div>
    </header>
  );
}
