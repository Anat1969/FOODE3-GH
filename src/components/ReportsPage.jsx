export default function ReportsPage({ positions }) {
  const total = positions.length;
  const approved = positions.filter(p => p.approval === 'מקובלת').length;
  const pending = positions.filter(p => p.approval === 'בבדיקה').length;
  const rejected = positions.filter(p => p.approval === 'לא מקובלת').length;
  const withLicense = positions.filter(p => p.businessLicense === 'יש').length;
  const goodWater = positions.filter(p => p.water === 'טוב').length;
  const goodElec = positions.filter(p => p.electricity === 'טוב').length;

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
            <li>מים תקינים: {goodWater} / {total}</li>
            <li>חשמל תקין: {goodElec} / {total}</li>
            <li>רישיון עסק: {withLicense} / {total}</li>
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
