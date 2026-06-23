export default function ReportsPage({ positions }) {
  const total = positions.length;
  const approved = positions.filter(p => p.approval === 'מיקום מקובל').length;
  const pending = positions.filter(p => p.approval === 'בבדיקה').length;
  const rejected = positions.filter(p => p.approval === 'מיקום לא מקובל').length;
  const goodWater = positions.filter(p => p.water === 'טוב').length;
  const goodElec = positions.filter(p => p.electricity === 'טוב').length;
  const goodSewage = positions.filter(p => p.sewage === 'טוב').length;

  return (
    <section className="reports-page glass-panel">
      <h2>דוחות</h2>
      <div className="report-grid">
        <div className="report-card">
          <h3>סטטוס אישור</h3>
          <ul>
            <li><span className="dot green" /> מקובלות: {approved}</li>
            <li><span className="dot orange" /> בבדיקה: {pending}</li>
            <li><span className="dot red" /> לא מקובלות: {rejected}</li>
          </ul>
        </div>
        <div className="report-card">
          <h3>תשתיות</h3>
          <ul>
            <li><span className={goodWater === total ? 'check-mark-small good' : 'check-mark-small bad'}>{goodWater === total ? '✓' : '✗'}</span> מים תקינים: {goodWater} / {total}</li>
            <li><span className={goodElec === total ? 'check-mark-small good' : 'check-mark-small bad'}>{goodElec === total ? '✓' : '✗'}</span> חשמל תקין: {goodElec} / {total}</li>
            <li><span className={goodSewage === total ? 'check-mark-small good' : 'check-mark-small bad'}>{goodSewage === total ? '✓' : '✗'}</span> ביוב תקין: {goodSewage} / {total}</li>
          </ul>
        </div>
        <div className="report-card">
          <h3>סה״כ</h3>
          <p className="big-number">{total}</p>
          <p>עמדות במערכת</p>
        </div>
      </div>
    </section>
  );
}
