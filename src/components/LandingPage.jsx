import { useState, useEffect } from 'react';

const FEATURES = [
  { icon: '📍', title: 'מיפוי לווייני', desc: 'סימון עמדות פודטראק על מפת לוויין אינטראקטיבית של אשדוד' },
  { icon: '⚡', title: 'ניהול בזמן אמת', desc: 'עדכון סטטוסים, תשתיות ואישורים בלחיצה אחת' },
  { icon: '📊', title: 'סטטיסטיקות חיות', desc: 'מעקב אחר שיעורי אישור, תשתיות ואיכות סביבה' },
  { icon: '🏗️', title: 'בקרת איכות', desc: 'הערכת מבנים, סביבה ותשתיות לכל עמדה' },
  { icon: '📜', title: 'מדיניות מובנית', desc: 'גישה מהירה למסמכי המדיניות והתקנות העירוניות' },
  { icon: '🔍', title: 'חיפוש מתקדם', desc: 'איתור עמדות לפי שם, מתחם, בעלים או כל שדה' },
];

const STATS_DEMO = [
  { value: '25+', label: 'עמדות פודטראק' },
  { value: '4', label: 'מתחמים פעילים' },
  { value: '92%', label: 'שיעור אישור' },
  { value: '24/7', label: 'ניטור בזמן אמת' },
];

export default function LandingPage({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setStatsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`landing-page ${visible ? 'visible' : ''}`}>
      <div className="landing-bg">
        <div className="landing-gradient" />
        <div className="landing-grid" />
      </div>

      <section className="landing-hero">
        <div className="landing-badge">עיריית אשדוד</div>
        <h1 className="landing-title">
          <span className="landing-title-line">מערכת ניהול</span>
          <span className="landing-title-highlight">עמדות פודטראק</span>
        </h1>
        <p className="landing-subtitle">
          פלטפורמה חכמה לניהול, מיפוי ובקרת איכות של עמדות מזון נייד ברחבי אשדוד
        </p>
        <div className="landing-cta">
          <button className="landing-btn primary" onClick={onEnter}>
            כניסה למערכת
            <span className="btn-arrow">←</span>
          </button>
        </div>
      </section>

      <section className={`landing-stats ${statsVisible ? 'visible' : ''}`}>
        {STATS_DEMO.map((s, i) => (
          <div key={i} className="landing-stat-card glass-panel" style={{ animationDelay: `${i * 0.15}s` }}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section className="landing-features">
        <h2>יכולות המערכת</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing-feature-card glass-panel">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>עיריית אשדוד · אגף רישוי עסקים · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
