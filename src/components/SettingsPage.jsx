export default function SettingsPage() {
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
      </div>
    </section>
  );
}
