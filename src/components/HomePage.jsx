import StatsRail from './StatsRail.jsx';
import MapPage from './MapPage.jsx';

export default function HomePage({ positions, trucks, setPage, mapProps }) {
  const complexes = new Set(positions.map(p => p.complexName)).size;
  return (
    <div className="home">
      <section className="home-hero glass-panel">
        <p className="eyebrow">עיריית אשדוד · ניהול עמדות פודטראק</p>
        <h2>עיר שאוכלים בה על הים, עם סדר ברור</h2>
        <p className="lead"><b>{positions.length}</b> עמדות ב-<b>{complexes}</b> מתחמים, ו-<b>{trucks.length}</b> הסכמים פעילים, במקום אחד.</p>
        <div className="home-trio">
          <article>
            <h3>החזון</h3>
            <p>פודטראקים הם חלק מהחוויה של אשדוד: חוף, מרינה, נחל ופארקים. החזון הוא <b>רשת עמדות מסודרת, בטוחה ונעימה</b> לתושבים ולמבקרים.</p>
          </article>
          <article>
            <h3>המטרה</h3>
            <p>לדעת <b>איפה מותר, איפה מוכן ואיפה צריך טיפול</b>: תשתיות (מים, חשמל, ביוב), איכות המבנה והסביבה, ותאריכי ההסכמים עם בעלי הפודטראקים.</p>
          </article>
          <article>
            <h3>הכלי</h3>
            <p>מערכת ניהול אחת: <b>רשימת עמדות, פודטראקים והסכמים, מפה ודוחות</b>. חיפוש אחד בסרגל העליון עובד בכל הדפים, והשינויים נשמרים בזמן אמת.</p>
          </article>
        </div>
        <div className="home-actions">
          <button className="primary" onClick={() => setPage('list')}>לרשימת העמדות</button>
          <button onClick={() => setPage('trucks')}>לפודטראקים והסכמים</button>
          <button onClick={() => setPage('reports')}>לדוחות</button>
        </div>
      </section>
      <StatsRail positions={positions} />
      <MapPage {...mapProps} positions={positions} />
    </div>
  );
}
