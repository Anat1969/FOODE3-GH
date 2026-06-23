import { useState, useEffect } from 'react';

const FEATURES = [
  {
    title: 'מיפוי לווייני',
    desc: 'סימון עמדות פודטראק על מפת לוויין אינטראקטיבית של אשדוד',
    back: 'מפת MapLibre עם שכבת לוויין, סימון נעיצות בזמן אמת ותצוגת מתחמים',
  },
  {
    title: 'ניהול בזמן אמת',
    desc: 'עדכון סטטוסים, תשתיות ואישורים בלחיצה אחת',
    back: 'סנכרון מיידי עם Supabase, שינויים מתעדכנים בכל המכשירים בו-זמנית',
  },
  {
    title: 'סטטיסטיקות חיות',
    desc: 'מעקב אחר שיעורי אישור, תשתיות ואיכות סביבה',
    back: 'פילטור אינטראקטיבי, סיכומים דינמיים ותצוגת מגמות',
  },
  {
    title: 'בקרת איכות',
    desc: 'הערכת מבנים, סביבה ותשתיות לכל עמדה',
    back: 'דירוג איכות מבנה, בדיקת תשתיות מים/חשמל/ביוב וסטטוס סביבתי',
  },
  {
    title: 'מדיניות מובנית',
    desc: 'גישה מהירה למסמכי המדיניות והתקנות העירוניות',
    back: 'עורך מדיניות מובנה עם שמירה מקומית ותמיכה בגרסאות',
  },
  {
    title: 'חיפוש מתקדם',
    desc: 'איתור עמדות לפי שם, מתחם, בעלים או כל שדה',
    back: 'חיפוש חופשי בכל השדות עם היסטוריית חיפושים ותוצאות מיידיות',
  },
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
            <div key={i} className="flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front glass-panel">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
                <div className="flip-card-back glass-panel">
                  <h3>{f.title}</h3>
                  <p>{f.back}</p>
                </div>
              </div>
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
