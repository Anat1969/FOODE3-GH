export default function StatsRail({ positions }) {
  const total = positions.length;
  const approved = positions.filter(p => p.approval === 'מקובלת').length;
  const pending = positions.filter(p => p.approval === 'בבדיקה').length;
  const rejected = positions.filter(p => p.approval === 'לא מקובלת').length;
  const pct = total ? Math.round((approved / total) * 100) : 0;
  return (
    <section className="stats-rail">
      <div className="stat orb"><strong>{pct}%</strong><span>מקובלות</span></div>
      <div className="stat"><strong>{total}</strong><span>עמדות</span></div>
      <div className="stat green"><strong>{approved}</strong><span>מקובלות</span></div>
      <div className="stat orange"><strong>{pending}</strong><span>בבדיקה</span></div>
      <div className="stat red"><strong>{rejected}</strong><span>לא מקובלות</span></div>
    </section>
  );
}
