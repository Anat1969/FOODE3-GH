import { useState } from 'react';

const POLICY_SECTIONS = [
  {
    id: 'intro',
    title: 'מבוא',
    content: `מסמך מדיניות זה מגדיר את התנאים, הדרישות והכללים להפעלת עמדות פודטראק בתחום העירוני של אשדוד. המדיניות נועדה להבטיח פעילות עסקית תקינה, בטיחות הציבור, ושמירה על איכות החיים.`
  },
  {
    id: 'conditions',
    title: 'תנאים להקמת עמדה',
    content: `1. העמדה תוצב אך ורק במיקום שאושר מראש על ידי מחלקת רישוי עסקים.
2. נדרש רישיון עסק תקף בהתאם לחוק רישוי עסקים, תשכ"ח-1968.
3. יש לוודא חיבור תקין למים, חשמל וביוב לפי תקנות הבריאות.
4. העמדה לא תחסום מעבר הולכי רגל, כלי רכב או מוצאי חירום.
5. יש לשמור על מרחק מינימלי של 50 מטר מבתי עסק קיימים המוכרים מוצרים דומים.`
  },
  {
    id: 'infrastructure',
    title: 'דרישות תשתית',
    content: `מים: חיבור למערכת מים עירונית או מכל מים תקני עם אישור משרד הבריאות.
חשמל: חיבור חשמל תקני עם מפסק פחת ואישור חשמלאי מוסמך.
ביוב: חיבור למערכת ביוב עירונית או מערכת טיפול עצמאית מאושרת.
פסולת: סידורי פינוי פסולת תקניים, כולל הפרדה במקור.`
  },
  {
    id: 'safety',
    title: 'בטיחות ותברואה',
    content: `1. יש להחזיק תעודת כושר תברואי מטעם משרד הבריאות.
2. נדרשים אמצעי כיבוי אש תקניים (מטף כיבוי 6 ק"ג לפחות).
3. עובדי המזון יעברו הדרכת תברואה שנתית.
4. יש לשמור על טמפרטורות אחסון תקניות למוצרי מזון.
5. ניקיון סביבת העמדה יבוצע באופן שוטף לפחות פעמיים ביום.`
  },
  {
    id: 'hours',
    title: 'שעות פעילות',
    content: `שעות הפעילות המותרות הן:
ימים א'-ה': 07:00–23:00
יום ו' וערבי חג: 07:00–15:00
מוצאי שבת וחג: משעת צאת השבת עד 23:00

בימי אירועים מיוחדים ניתן לבקש הארכת שעות פעילות באישור מראש.`
  },
  {
    id: 'appearance',
    title: 'מראה חיצוני ועיצוב',
    content: `1. העמדה תעמוד בקוד אסתטי שייקבע על ידי מחלקת הנדסה עירונית.
2. שילוט יהיה בהתאם לתקנות השילוט העירוניות.
3. גודל העמדה לא יעלה על 12 מ"ר.
4. צבעי העמדה יהיו מתואמים עם הסביבה הבנויה.
5. אין להציב שולחנות וכיסאות מעבר לשטח המוקצה.`
  },
  {
    id: 'enforcement',
    title: 'אכיפה וסנקציות',
    content: `אי-עמידה בתנאי המדיניות עלולה לגרור:
- התראה בכתב לתיקון הליקויים תוך 14 ימי עבודה.
- קנס כספי בהתאם לחוק העזר העירוני.
- התלייה זמנית של רישיון העסק.
- ביטול הרישיון במקרים חמורים או חוזרים.

ערעורים ניתן להגיש לוועדת ערר עירונית תוך 30 יום.`
  },
];

const LEGEND = [
  { color: 'var(--green)', label: 'מקובלת', desc: 'עמדה שעומדת בכל הדרישות ואושרה להפעלה' },
  { color: 'var(--orange)', label: 'בבדיקה', desc: 'עמדה בתהליך אישור, ממתינה להשלמת בדיקות' },
  { color: 'var(--red)', label: 'לא מקובלת', desc: 'עמדה שלא עומדת בדרישות ולא אושרה' },
  { color: 'var(--blue)', label: 'תשתית תקינה', desc: 'מים / חשמל / ביוב מחוברים ותקינים' },
];

export default function PolicyViewer({ onClose }) {
  const [activeSection, setActiveSection] = useState('intro');

  return (
    <div className="policy-overlay" onClick={onClose}>
      <div className="policy-modal glass-panel" onClick={e => e.stopPropagation()}>
        <div className="policy-header">
          <h2>📜 מסמך מדיניות – עמדות פודטראק אשדוד</h2>
          <button className="ghost" onClick={onClose}>✕</button>
        </div>
        <div className="policy-body">
          <div className="policy-content">
            <nav className="policy-toc">
              {POLICY_SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={activeSection === s.id ? 'active' : ''}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(`policy-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {s.title}
                </button>
              ))}
            </nav>
            <div className="policy-text">
              {POLICY_SECTIONS.map(s => (
                <div key={s.id} id={`policy-${s.id}`} className="policy-section">
                  <h3>{s.title}</h3>
                  <p>{s.content}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="policy-legend">
            <h3>מקרא</h3>
            {LEGEND.map((item, i) => (
              <div key={i} className="legend-item">
                <span className="legend-color" style={{ background: item.color }} />
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
