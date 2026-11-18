import { useEffect, useRef, useState } from 'react';
import { createPolicyScene } from './policyScene.js';
import { POLICY_STEPS, KEY_NUMBERS } from '../data/policyData.js';

// מציג **טקסט** כהדגשה
function Rich({ text }) {
  return text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

export default function PolicyPage() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [active, setActive] = useState('place');
  const [spin, setSpin] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    try {
      sceneRef.current = createPolicyScene(mountRef.current);
      sceneRef.current.setView('place');
    } catch (e) {
      setWebglOk(false);
    }
    return () => sceneRef.current?.dispose();
  }, []);

  useEffect(() => { sceneRef.current?.setView(active); }, [active]);
  useEffect(() => { sceneRef.current?.setAutoRotate(spin); }, [spin]);

  const step = POLICY_STEPS.find(s => s.id === active);
  const idx = POLICY_STEPS.indexOf(step);
  const go = (d) => setActive(POLICY_STEPS[(idx + d + POLICY_STEPS.length) % POLICY_STEPS.length].id);

  return (
    <section className="policy-page glass-panel">
      <header className="policy-head">
        <h2>מדיניות הצבת פודטראקים: המדריך התלת־ממדי</h2>
        <p>שישה שלבים מתוך מדיניות העירייה, יוני 2026. בוחרים שלב, וגוררים כדי לסובב.</p>
      </header>

      <div className="policy-key-numbers">
        {KEY_NUMBERS.map(([n, l]) => (
          <div key={l}><b>{n}</b><span>{l}</span></div>
        ))}
      </div>

      <div className="policy-layout">
        <div className="policy-stage">
          <div ref={mountRef} className="policy-canvas" />
          {!webglOk && <div className="policy-fallback">הדפדפן אינו תומך בתלת־ממד. הכללים מוצגים בצד.</div>}
          <div className="policy-stage-tools">
            <button onClick={() => setSpin(!spin)} className={spin ? 'active' : ''}>{spin ? 'עצור סיבוב' : 'סיבוב אוטומטי'}</button>
            <button onClick={() => sceneRef.current?.setView(active)}>איפוס מצלמה</button>
          </div>
        </div>

        <aside className="policy-side">
          <nav className="policy-steps">
            {POLICY_STEPS.map((s, i) => (
              <button key={s.id} className={s.id === active ? 'active' : ''} onClick={() => setActive(s.id)}>
                <em>{i + 1}</em>{s.title}
              </button>
            ))}
          </nav>
          <div className="policy-card">
            <h3>{step.insight}</h3>
            <small>{step.source}</small>
            <ol>
              {step.rules.map((r, i) => <li key={i}><Rich text={r} /></li>)}
            </ol>
            <div className="policy-nav">
              <button onClick={() => go(-1)}>הקודם</button>
              <button onClick={() => go(1)}>הבא</button>
            </div>
          </div>
          <div className="policy-legend">
            <span><i className="g" /> מותר או נדרש</span>
            <span><i className="r" /> אסור</span>
            <span><i className="a" /> מידה</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
