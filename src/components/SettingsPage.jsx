import { clearEditorKey } from '../supabase.js';

export default function SettingsPage({ theme, setTheme, editor, onEditorChange }) {
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
            <div className="settings-editor">
              <span className="card-value">המכשיר הזה מחובר לעריכה בשם {editor}.</span>
              <button
                type="button"
                className="btn"
                onClick={() => { if (window.confirm('לנתק את המכשיר הזה מהעריכה? אפשר לחזור דרך קישור העריכה.')) { clearEditorKey(); onEditorChange(null); } }}
              >
                ניתוק מהעריכה
              </button>
            </div>
          ) : (
            <span className="card-value">תצוגה בלבד. עריכה נפתחת דרך קישור העריכה האישי.</span>
          )}
        </div>
      </div>
    </section>
  );
}
