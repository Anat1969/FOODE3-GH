import { useEffect, useRef, useState } from 'react';
import { createPolicyScene } from './policy3dScene.js';
import { POLICY_STEPS, KEY_NUMBERS } from '../data/policy3dData.js';
import '../policy3d.css';

// מציג **טקסט** כהדגשה
function Rich({ text }) {
  return text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

const MODES = [['free', 'חופשי'], ['iso', 'איזומטרי'], ['top', 'מבט על'], ['front', 'חזית']];

function readTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export default function Policy3D({ onOpenChapter }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [active, setActive] = useState('place');
  const [spin, setSpin] = useState(false);
  const [mode, setMode] = useState('free');
  const [tour, setTour] = useState(false);
  const modeRef = useRef('free');
  const [webglOk, setWebglOk] = useState(true);
  const [theme, setTheme] = useState(readTheme);
  const activeRef = useRef(active);
  activeRef.current = active;
  modeRef.current = mode;

  // ההמחשה עוקבת אחרי ערכת הנושא של האפליקציה (כהה או בהיר).
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    try {
      sceneRef.current = createPolicyScene(mountRef.current);
      sceneRef.current.setMode(modeRef.current);
      sceneRef.current.setView(activeRef.current);
      setWebglOk(true);
    } catch {
      setWebglOk(false);
    }
    return () => { sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [theme]);

  useEffect(() => { sceneRef.current?.setView(active); }, [active]);
  useEffect(() => { sceneRef.current?.setMode(mode); }, [mode]);

  // סיור: עובר אוטומטית בין ארבעת המבטים
  useEffect(() => {
    if (!tour) return undefined;
    const order = ['iso', 'front', 'top', 'free'];
    const id = setInterval(() => setMode(m => order[(order.indexOf(m) + 1) % order.length]), 3500);
    return () => clearInterval(id);
  }, [tour]);
  useEffect(() => { sceneRef.current?.setAutoRotate(spin); }, [spin, theme]);

  const step = POLICY_STEPS.find(s => s.id === active);
  const idx = POLICY_STEPS.indexOf(step);
  const go = (d) => setActive(POLICY_STEPS[(idx + d + POLICY_STEPS.length) % POLICY_STEPS.length].id);

  return (
    <div className="p3d">
      <p className="p3d-lead">שישה שלבים מתוך הוראות המדיניות. בוחרים שלב וגוררים כדי לסובב.</p>

      <div className="p3d-numbers">
        {KEY_NUMBERS.map(([n, l]) => (
          <div key={l}><b>{n}</b><span>{l}</span></div>
        ))}
      </div>

      <div className="p3d-layout">
        <div className="p3d-stage">
          <div ref={mountRef} className="p3d-canvas" />
          {!webglOk && <div className="p3d-fallback">הדפדפן אינו תומך בתלת־ממד. הכללים מוצגים בצד.</div>}
          <div className="p3d-tools">
            <div className="p3d-modes" role="group" aria-label="זווית מבט">
              {MODES.map(([id, label]) => (
                <button key={id} className={`btn ${mode === id ? 'primary' : ''}`} aria-pressed={mode === id} onClick={() => { setTour(false); setMode(id); }}>{label}</button>
              ))}
            </div>
            <button className={`btn ${tour ? 'primary' : ''}`} onClick={() => setTour(!tour)}>{tour ? 'עצור סיור' : 'סיור'}</button>
            <button className={`btn ${spin ? 'primary' : ''}`} onClick={() => setSpin(!spin)}>{spin ? 'עצור סיבוב' : 'סיבוב'}</button>
            <button className="btn" onClick={() => sceneRef.current?.setView(active)}>איפוס</button>
          </div>
          <div className="p3d-legend">
            <span><i className="g" />מותר או נדרש</span>
            <span><i className="r" />אסור</span>
            <span><i className="a" />מידה</span>
          </div>
        </div>

        <aside className="p3d-side">
          <nav className="p3d-steps" aria-label="שלבי המדיניות">
            {POLICY_STEPS.map((s, i) => (
              <button key={s.id} className={s.id === active ? 'active' : ''} aria-pressed={s.id === active} onClick={() => setActive(s.id)}>
                <em>{i + 1}</em>{s.title}
              </button>
            ))}
          </nav>
          <div className="p3d-card" aria-live="polite">
            <h3>{step.insight}</h3>
            <ol>
              {step.rules.map((r, i) => <li key={i}><Rich text={r} /></li>)}
            </ol>
            <div className="p3d-nav">
              <button className="btn" onClick={() => go(-1)}>הקודם</button>
              <button className="btn" onClick={() => go(1)}>הבא</button>
            </div>
            {onOpenChapter && (
              <button className="p3d-chapter" onClick={() => onOpenChapter(step.chapter)}>
                לטקסט המלא ב{step.chapterLabel}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
