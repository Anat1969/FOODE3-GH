import { useState } from 'react';

const DEFAULT_LINKS = [
  { id: '1', title: 'עיריית אשדוד', url: 'https://www.ashdod.muni.il' },
  { id: '2', title: 'רישוי עסקים', url: 'https://www.gov.il/he/departments/topics/business-licensing' },
];

export default function LinksViewer({ iframeUrl, setIframeUrl }) {
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem('foode3-links');
    return saved ? JSON.parse(saved) : DEFAULT_LINKS;
  });
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const saveLinks = (updated) => {
    setLinks(updated);
    localStorage.setItem('foode3-links', JSON.stringify(updated));
  };

  const addLink = () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    const link = { id: Date.now().toString(), title: newTitle.trim() || url, url };
    saveLinks([...links, link]);
    setNewTitle('');
    setNewUrl('');
  };

  const removeLink = (id) => {
    saveLinks(links.filter(l => l.id !== id));
  };

  return (
    <section className="links-page glass-panel">
      <div className="links-layout">
        <div className="links-sidebar">
          <h2>קישורים</h2>
          <div className="links-add">
            <input
              placeholder="שם הקישור"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <input
              placeholder="כתובת URL"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLink()}
              dir="ltr"
            />
            <button className="primary" onClick={addLink}>+ הוסף</button>
          </div>
          <ul className="links-list">
            {links.map(link => (
              <li key={link.id} className={iframeUrl === link.url ? 'active' : ''}>
                <button className="link-item" onClick={() => setIframeUrl(link.url)}>
                  <span className="link-icon">🔗</span>
                  <span className="link-title">{link.title}</span>
                </button>
                <button className="link-remove ghost" onClick={() => removeLink(link.id)}>✕</button>
              </li>
            ))}
          </ul>
          {iframeUrl && (
            <button className="link-open-external" onClick={() => window.open(iframeUrl, '_blank')}>
              ↗ פתח בחלון חדש
            </button>
          )}
        </div>
        <div className="links-frame-wrap">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="links-iframe"
              title="תצוגת קישור"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            <div className="links-empty">
              <span>🔗</span>
              <p>בחרי קישור מהרשימה לצפייה</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
