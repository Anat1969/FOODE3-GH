export default function ActionReportPage({ positions }) {
  const scorePosition = (p) => {
    let score = 0;
    if (p.approval === 'מיקום לא מקובל') score += 30;
    else if (p.approval === 'בבדיקה') score += 15;
    if (p.water === 'לא טוב') score += 10;
    if (p.electricity === 'לא טוב') score += 10;
    if (p.sewage === 'לא טוב') score += 10;
    if (p.buildingQuality === 'מבנה לא מקובל') score += 10;
    else if (p.buildingQuality === 'אין מבנה') score += 5;
    if (p.environmentQuality === 'אזהרה') score += 10;
    else if (p.environmentQuality === 'טעון שיפור') score += 5;
    return score;
  };

  const getIssues = (p) => {
    const issues = [];
    if (p.approval === 'מיקום לא מקובל') issues.push('מיקום לא מאושר');
    if (p.approval === 'בבדיקה') issues.push('ממתין לאישור');
    if (p.water === 'לא טוב') issues.push('תקלת מים');
    if (p.electricity === 'לא טוב') issues.push('תקלת חשמל');
    if (p.sewage === 'לא טוב') issues.push('תקלת ביוב');
    if (p.buildingQuality === 'מבנה לא מקובל') issues.push('מבנה לא עומד בתקן');
    if (p.buildingQuality === 'אין מבנה') issues.push('אין מבנה קיים');
    if (p.environmentQuality === 'אזהרה') issues.push('אזהרת איכות סביבה');
    if (p.environmentQuality === 'טעון שיפור') issues.push('סביבה טעונה שיפור');
    return issues;
  };

  const getActions = (p) => {
    const actions = [];
    if (p.water === 'לא טוב') actions.push('לתקן חיבור מים');
    if (p.electricity === 'לא טוב') actions.push('לתקן חיבור חשמל');
    if (p.sewage === 'לא טוב') actions.push('לתקן חיבור ביוב');
    if (p.buildingQuality === 'מבנה לא מקובל') actions.push('לשפר/להחליף מבנה');
    if (p.buildingQuality === 'אין מבנה') actions.push('להקים מבנה מתאים');
    if (p.environmentQuality === 'אזהרה') actions.push('לטפל באיכות הסביבה מיד');
    if (p.environmentQuality === 'טעון שיפור') actions.push('לשפר איכות סביבה');
    if (p.approval === 'בבדיקה') actions.push('להשלים תהליך אישור');
    if (p.approval === 'מיקום לא מקובל') actions.push('לבדוק התאמה מחדש לאישור');
    return actions;
  };

  const problemPositions = positions
    .map(p => ({ ...p, score: scorePosition(p), issues: getIssues(p), actions: getActions(p) }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  const total = positions.length;
  const approved = positions.filter(p => p.approval === 'מיקום מקובל').length;
  const pending = positions.filter(p => p.approval === 'בבדיקה').length;
  const rejected = positions.filter(p => p.approval === 'מיקום לא מקובל').length;
  const now = new Date();
  const dateStr = now.toLocaleDateString('he-IL');
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  const severityLabel = (score) => {
    if (score >= 30) return 'קריטי';
    if (score >= 15) return 'בינוני';
    return 'נמוך';
  };

  const severityClass = (score) => {
    if (score >= 30) return 'severity-critical';
    if (score >= 15) return 'severity-medium';
    return 'severity-low';
  };

  return (
    <section className="action-report">
      <div className="report-header-bar">
        <h2>דוח לטיפול – עמדות פודטראק</h2>
        <button className="print-btn" onClick={() => window.print()}>הדפסה</button>
      </div>

      <div className="report-print-area">
        <div className="report-letterhead">
          <h1>עיריית אשדוד – אגף רישוי עסקים</h1>
          <h2>דוח סיכום לטיפול – עמדות פודטראק</h2>
          <p className="report-date">תאריך: {dateStr} | שעה: {timeStr}</p>
        </div>

        <div className="report-summary-strip">
          <div className="report-summary-item">
            <strong>{total}</strong>
            <span>סה"כ עמדות</span>
          </div>
          <div className="report-summary-item green-text">
            <strong>{approved}</strong>
            <span>מאושרות</span>
          </div>
          <div className="report-summary-item orange-text">
            <strong>{pending}</strong>
            <span>בבדיקה</span>
          </div>
          <div className="report-summary-item red-text">
            <strong>{rejected}</strong>
            <span>לא מאושרות</span>
          </div>
          <div className="report-summary-item">
            <strong>{problemPositions.length}</strong>
            <span>דורשות טיפול</span>
          </div>
        </div>

        {problemPositions.length === 0 ? (
          <p className="report-empty">כל העמדות תקינות – אין בעיות לטיפול.</p>
        ) : (
          <ol className="report-list">
            {problemPositions.map((p, i) => (
              <li key={p.id} className={`report-item ${severityClass(p.score)}`}>
                <div className="report-item-header">
                  <span className="report-item-num">{i + 1}.</span>
                  <strong className="report-item-name">{p.positionName}</strong>
                  {p.complexName && <span className="report-item-complex">({p.complexName})</span>}
                  <span className={`report-severity-badge ${severityClass(p.score)}`}>
                    {severityLabel(p.score)}
                  </span>
                </div>

                <div className="report-item-details">
                  <div className="report-meta">
                    <span>מס׳: {p.number}</span>
                    {p.ownerName && <span>בעלים: {p.ownerName}</span>}
                    {p.businessName && <span>עסק: {p.businessName}</span>}
                    <span>סטטוס: {p.approval}</span>
                  </div>

                  <div className="report-section">
                    <h4>בעיות שזוהו:</h4>
                    <ul>
                      {p.issues.map((issue, j) => (
                        <li key={j}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  {p.notes && (
                    <div className="report-section">
                      <h4>הערות:</h4>
                      <p>{p.notes}</p>
                    </div>
                  )}

                  <div className="report-section">
                    <h4>פעולות נדרשות:</h4>
                    <ol>
                      {p.actions.map((action, j) => (
                        <li key={j}>{action}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="report-footer-print">
          <p>הופק אוטומטית ממערכת ניהול עמדות פודטראק – עיריית אשדוד | {dateStr}</p>
        </div>
      </div>
    </section>
  );
}
