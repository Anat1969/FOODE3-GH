export default function SettingsPage({ theme, setTheme }) {
  return (
    <section className="settings-page glass-panel">
      <h2>הגדרות</h2>
      <div className="settings-grid">
        <label className="field">
          <span>שם המערכת</span>
          <input defaultValue="מערכת ניהול עמדות פודטראק – אשדוד" />
        </label>
        <label className="field">
          <span>עיר</span>
          <input defaultValue="אשדוד" />
        </label>
        <label className="field">
          <span>שמירה אוטומטית</span>
          <select defaultValue="כן"><option>כן</option><option>לא</option></select>
        </label>
        <div className="field">
          <span>מצב תאורה</span>
          <div className="theme-toggle">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              ☀️ בהיר
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              🌙 כהה
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
