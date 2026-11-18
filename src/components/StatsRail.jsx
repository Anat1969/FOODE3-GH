export default function StatsRail({ positions, activeFilter, onFilter }) {
  const count = (fn) => positions.filter(fn).length;
  const stats = [
    ['all', 'עמדות', positions.length, ''],
    ['approved', 'מקובלות', count(p => p.approval === 'מיקום מקובל'), 'green'],
    ['pending', 'בבדיקה', count(p => p.approval === 'בבדיקה'), 'orange'],
    ['rejected', 'לא מקובלות', count(p => p.approval === 'מיקום לא מקובל'), 'red'],
    ['harmonica', 'הרמוניקה ממתינה', count(p => p.harmonicaStatus === 'הוגשה'), 'blue'],
  ];

  return (
    <nav className="stat-strip" aria-label="סינון לפי סטטוס">
      {stats.map(([id, label, value, tone]) => (
        <button
          key={id}
          type="button"
          className={`stat-chip ${tone} ${activeFilter === id ? 'active' : ''}`}
          aria-pressed={activeFilter === id}
          onClick={() => onFilter(id)}
        >
          <strong>{value}</strong>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
