export default function SettingsPage({ theme, setTheme, editor }) {
  return (
    <section className="settings-page panel">
      <h2>הגדרות</h2>
      <div className="settings-grid">
        <div className="card-field">
          <span className="card-label">מצב תאורה</span>
          <div className="segmented" role="group">
            <button type="button" className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>בהיר</button>
            <button type="button" className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>כהה</button>
          </div>
        </div>
        <div className="card-field">
          <span className="card-label">הרשאת עריכה</span>
          {editor ? (
            <span className="card-value">המכשיר הזה מחובר לעריכה בשם {editor}. כל השדות ניתנים לעריכה ונשמרים מעצמם. ניתוק: בכפתור הלוגו A&amp;I.</span>
          ) : (
            <span className="card-value">תצוגה בלבד. לעריכה יש לפתוח פעם אחת את קישור העריכה האישי במכשיר הזה, או להדביק אותו בכפתור הלוגו A&amp;I.</span>
          )}
        </div>
      </div>
    </section>
  );
}
