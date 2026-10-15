import { clearEditorKey } from '../supabase.js';
import { DEV_CHAT_URL, RESEARCH_URL } from './TopBar.jsx';

export default function SettingsPage({ theme, setTheme, editor, onEditorChange, notify, canInstall, onInstall }) {
  const copyAppLink = async () => {
    try { await navigator.clipboard.writeText(window.location.origin + '/'); notify('הקישור לאפליקציה הועתק'); }
    catch { notify('לא ניתן להעתיק אוטומטית', 'error'); }
  };

  return (
    <section className="settings-page panel">
      <h2>הגדרות</h2>
      <div className="settings-grid">
        <div className="card-field">
          <span className="card-label">קישורים</span>
          <div className="card-actions">
            <button type="button" className="btn" onClick={copyAppLink}>העתקת קישור</button>
            <a className="btn" href={DEV_CHAT_URL} target="_blank" rel="noreferrer">שיחת הפיתוח</a>
            <a className="btn" href={RESEARCH_URL} target="_blank" rel="noreferrer">פרויקט המחקר</a>
            {canInstall && <button type="button" className="btn primary" onClick={onInstall}>התקנת האפליקציה</button>}
          </div>
          <span className="card-hint">לקישור לעמדה מסוימת: הכפתור "העתקת קישור לכרטיס" בתוך כרטיס העמדה.</span>
        </div>
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
              <span className="card-value">המכשיר הזה מחובר לעריכה בשם {editor}. כל השדות ניתנים לעריכה ונשמרים מעצמם.</span>
              <button
                type="button"
                className="btn"
                onClick={() => { if (window.confirm('לנתק את המכשיר הזה מהעריכה? אפשר לחזור דרך קישור העריכה.')) { clearEditorKey(); onEditorChange(null); } }}
              >
                ניתוק מהעריכה
              </button>
            </div>
          ) : (
            <span className="card-value">תצוגה בלבד. לעריכה יש לפתוח פעם אחת את קישור העריכה האישי במכשיר הזה.</span>
          )}
        </div>
      </div>
    </section>
  );
}
