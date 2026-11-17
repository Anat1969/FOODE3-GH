import StatsRail from './StatsRail.jsx';
import MapPage from './MapPage.jsx';

export default function HomePage({ positions, trucks, mapProps }) {
  const complexes = new Set(positions.map(p => p.complexName)).size;
  return (
    <div className="home">
      <section className="home-strip glass-panel">
        <div className="home-title">
          <p className="eyebrow">עיריית אשדוד · ניהול עמדות פודטראק</p>
          <h2>עיר שאוכלים בה על הים, עם סדר ברור</h2>
          <p className="lead"><b>{positions.length}</b> עמדות ב-<b>{complexes}</b> מתחמים · <b>{trucks.length}</b> הסכמים פעילים</p>
        </div>
        <div className="home-trio compact">
          <article><h3>החזון</h3><p>רשת עמדות <b>מסודרת, בטוחה ונעימה</b> לתושבים ולמבקרים.</p></article>
          <article><h3>המטרה</h3><p>לדעת <b>איפה מותר, איפה מוכן ואיפה צריך טיפול</b>: תשתיות, איכות והסכמים.</p></article>
          <article><h3>הכלי</h3><p>מפה, רשימה, פודטראקים ודוחות, עם <b>חיפוש אחד</b> בכל הדפים.</p></article>
        </div>
        <StatsRail positions={positions} />
      </section>
      <MapPage {...mapProps} positions={positions} embedded />
    </div>
  );
}
