import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';

function toEmbedUrl(url) {
  if (!url) return url;
  // Canva - convert to embed view
  if (/canva\.com\/design\//.test(url)) {
    const clean = url.split('?')[0];
    if (!clean.endsWith('/view')) {
      return clean + '/view?embed';
    }
    return clean + '?embed';
  }
  // Google Docs/Sheets/Slides
  if (/docs\.google\.com\/(document|spreadsheets|presentation)\/d\//.test(url)) {
    if (!url.includes('/pub') && !url.includes('/embed')) {
      return url.replace(/\/edit.*$/, '/preview');
    }
  }
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Google Maps
  if (/google\.\w+\/maps/.test(url) && !url.includes('/embed')) {
    return url.replace('/maps/', '/maps/embed/');
  }
  return url;
}

export default function LinksViewer({ iframeUrl, setIframeUrl }) {
  const [links, setLinks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          const saved = localStorage.getItem('foode3-links');
          if (saved) setLinks(JSON.parse(saved));
        } else {
          setLinks(data || []);
        }
      });
  }, []);

  const saveLink = async (link) => {
    const { error } = await supabase.from('links').insert(link);
    if (error) {
      localStorage.setItem('foode3-links', JSON.stringify([...links, link]));
    }
  };

  const deleteLink = async (id) => {
    await supabase.from('links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
    if (links.find(l => l.id === id)?.url === iframeUrl) setIframeUrl(null);
  };

  const addLink = () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    const link = {
      id: crypto.randomUUID(),
      title: newTitle.trim() || url,
      url,
      created_at: new Date().toISOString(),
    };
    setLinks(prev => [...prev, link]);
    saveLink(link);
    setNewTitle('');
    setNewUrl('');
    setIframeUrl(url);
  };

  const activeEmbedUrl = iframeUrl ? toEmbedUrl(iframeUrl) : null;

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
                <button className="link-item" onClick={() => { setIframeUrl(link.url); setLoadError(false); }}>
                  <span className="link-icon">🔗</span>
                  <span className="link-title">{link.title}</span>
                </button>
                <button className="link-remove ghost" onClick={() => deleteLink(link.id)}>✕</button>
              </li>
            ))}
          </ul>
          {iframeUrl && (
            <div className="links-bottom-actions">
              <button className="link-open-external" onClick={() => window.open(iframeUrl, '_blank')}>
                ↗ פתח בחלון חדש
              </button>
              <button className="link-open-external" onClick={() => { setIframeUrl(null); setLoadError(false); }}>
                ✕ סגור תצוגה
              </button>
            </div>
          )}
        </div>
        <div className="links-frame-wrap">
          {activeEmbedUrl ? (
            <>
              {loadError && (
                <div className="iframe-fallback">
                  <p>האתר חוסם תצוגה מוטמעת</p>
                  <button className="primary" onClick={() => window.open(iframeUrl, '_blank')}>↗ פתח בחלון חדש</button>
                </div>
              )}
              <iframe
                key={activeEmbedUrl}
                src={activeEmbedUrl}
                className="links-iframe"
                title="תצוגת קישור"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"
                allow="fullscreen; clipboard-write"
                referrerPolicy="no-referrer-when-downgrade"
                style={loadError ? { display: 'none' } : {}}
                onError={() => setLoadError(true)}
              />
            </>
          ) : (
            <div className="links-empty">
              <span>🔗</span>
              <p>בחרי קישור מהרשימה לצפייה</p>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                תומך ב-Canva, Google Docs, YouTube, ועוד
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
