export default function StatsRail({ positions, activeFilter, onFilter }) {
  const total = positions.length;
  const approved = positions.filter(p => p.approval === 'מקובלת').length;
  const pending = positions.filter(p => p.approval === 'בבדיקה').length;
  const rejected = positions.filter(p => p.approval === 'לא מקובלת').length;
  const pct = total ? Math.round((approved / total) * 100) : 0;

  const summaries = {
    all: `סה"כ ${total} עמדות פודטראק רשומות במערכת הניהול של אשדוד.`,
    approved: `${approved} עמדות אושרו ועומדות בכל הדרישות הנדרשות: תשתיות תקינות, רישיון עסק, ואיכות סביבה מתאימה.`,
    pending: `${pending} עמדות נמצאות בתהליך בדיקה ואישור. יש להשלים את הבדיקות ולעדכן את הסטטוס.`,
    rejected: `${rejected} עמדות לא אושרו עקב חוסר בתשתיות, בעיות ברישוי, או אי-עמידה בתקנים.`,
  };

  const active = activeFilter;
  const summaryText = active ? summaries[active] : null;

  return (
    <section className="stats-rail-wrap">
      <div className="stats-rail">
        <button
          className={`stat orb ${active === 'approved' ? 'active-filter' : ''}`}
          onClick={() => onFilter('approved')}
          title="הצג עמדות מקובלות"
        >
          <strong>{pct}%</strong><span>מקובלות</span>
        </button>
        <button
          className={`stat ${active === 'all' ? 'active-filter' : ''}`}
          onClick={() => onFilter('all')}
          title="הצג את כל העמדות"
        >
          <strong>{total}</strong><span>עמדות</span>
        </button>
        <button
          className={`stat green ${active === 'approved' ? 'active-filter' : ''}`}
          onClick={() => onFilter('approved')}
          title="הצג עמדות מקובלות"
        >
          <strong>{approved}</strong><span>מקובלות</span>
        </button>
        <button
          className={`stat orange ${active === 'pending' ? 'active-filter' : ''}`}
          onClick={() => onFilter('pending')}
          title="הצג עמדות בבדיקה"
        >
          <strong>{pending}</strong><span>בבדיקה</span>
        </button>
        <button
          className={`stat red ${active === 'rejected' ? 'active-filter' : ''}`}
          onClick={() => onFilter('rejected')}
          title="הצג עמדות לא מקובלות"
        >
          <strong>{rejected}</strong><span>לא מקובלות</span>
        </button>
      </div>
      {summaryText && (
        <div className="stats-summary glass-panel">
          <p>{summaryText}</p>
          <button className="ghost" onClick={() => onFilter(active)}>✕</button>
        </div>
      )}
    </section>
  );
}
