export default function TopBar({ page, setPage, lastSaved, editMode, setEditMode, onShowPolicy }) {
  const tabs = [
    ['list', 'רשימת עמדות'],
    ['map', 'מפת עמדות'],
    ['reports', 'דוחות'],
    ['links', 'קישורים'],
    ['settings', 'הגדרות']
  ];
  return (
    <header className="topbar glass-panel">
      <div className="top-line">
        <div className="userbox">
          <button className="icon-button" aria-label="תפריט">☰</button>
          <div className="avatar">●</div>
          <span>שלום, מנהל מערכת</span>
        </div>
        <h1>מערכת ניהול עמדות פודטראק – אשדוד</h1>
        <div className="save-indicator"><span className="dot green" /> נשמר בזמן אמת {lastSaved && `· ${lastSaved}`}</div>
        <div className="traffic-lights"><i/><i/><i/></div>
      </div>
      <div className="tabs-row">
        <nav className="tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>{label}</button>
          ))}
        </nav>
        <div className="tabs-actions">
          <button className="policy-btn" onClick={onShowPolicy}>📜 מדיניות</button>
          <button className={`edit-toggle ${editMode ? 'active' : ''}`} onClick={() => setEditMode(!editMode)}>
            {editMode ? '✏️ מצב עריכה' : '👁️ מצב תצוגה'}
          </button>
        </div>
      </div>
    </header>
  );
}
