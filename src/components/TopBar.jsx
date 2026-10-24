import { useEffect, useRef } from 'react';
import { checkEditor, clearEditorKey, setEditorKey } from '../supabase.js';

export const DEV_CHAT_URL = 'https://claude.ai/code/session_01ELjmgCtCVbBT1AstY1Wrrk';
export const RESEARCH_URL = 'https://claude.ai/project/019e3627-fb8b-769c-8380-1daf25bcf8b7';

export const TABS = [
  ['list', 'רשימת עמדות'],
  ['map', 'מפת עמדות'],
  ['report', 'דוח לטיפול'],
  ['examples', 'דוגמאות'],
  ['links', 'קישורים'],
  ['policy', 'מדיניות'],
  ['settings', 'הגדרות'],
];

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

export default function TopBar({ page, go, editor, saveState, onEditorChange }) {
  const ref = useRef(null);
  const menu = useRef(null);

  // The A&I logo button: copy link, dev chat, research project, install, and connecting this device for editing.
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    el.items = editor
      ? [{
          label: 'ניתוק המכשיר מהעריכה',
          hint: editor,
          onSelect: () => { if (window.confirm('לנתק את המכשיר הזה מהעריכה? אפשר לחזור דרך קישור העריכה.')) { clearEditorKey(); onEditorChange(null); } },
        }]
      : [{
          label: 'חיבור המכשיר לעריכה',
          hint: 'קישור או מפתח',
          onSelect: async () => {
            const v = window.prompt('הדביקי את קישור העריכה או את המפתח')?.trim();
            const key = v?.match(/[?&]edit=([^&#\s]+)/)?.[1] ?? v;
            if (!key) return;
            setEditorKey(key);
            const name = await checkEditor();
            if (!name) { clearEditorKey(); window.alert('המפתח לא תקף'); }
            onEditorChange(name);
          },
        }];
  }, [editor, onEditorChange]);

  // Exposes the bar height so cards and overlays open below it.
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--topbar-h', `${Math.ceil(entry.target.getBoundingClientRect().height)}px`);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <header className="topbar" ref={ref}>
      <div className="topbar-row">
        <a className="brand" href="/" onClick={e => { e.preventDefault(); go('home'); }} title="דף הבית">
          <img src="/icon-192.png" alt="" className="brand-mark" width="32" height="32" />
          <span className="brand-text">
            <span className="brand-name">פודטראק אשדוד</span>
            <span className="brand-sub">ניהול עמדות</span>
          </span>
        </a>
        <nav className="tabs" aria-label="ניווט ראשי">
          {TABS.map(([id, label]) => (
            <button key={id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="topbar-end">
          <SaveIndicator saveState={saveState} editor={editor} />
          <img src="/ashdod-logo.png" alt="עיריית אשדוד" className="city-logo" height="40" />
          <ai-menu ref={menu} chat={DEV_CHAT_URL} research={RESEARCH_URL} />
        </div>
      </div>
    </header>
  );
}
