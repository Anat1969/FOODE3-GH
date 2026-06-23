import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase.js';

const STORAGE_KEY = 'foode3-examples';
const BUCKET = 'images';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveLocal(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function ExampleCard({ item, onUpdate, onDelete, editMode }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `examples/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onUpdate({ imageUrl: data.publicUrl });
    }
    setUploading(false);
  };

  return (
    <div className="example-card glass-panel">
      <div className="example-image-wrap">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title || 'דוגמה'} className="example-image" />
        ) : (
          <div className="example-image-placeholder">
            {editMode ? 'לחצי להעלאת תמונה' : 'אין תמונה'}
          </div>
        )}
        {editMode && (
          <>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            <button className="example-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? '...' : '📷'}
            </button>
          </>
        )}
      </div>
      <div className="example-content">
        {editMode ? (
          <>
            <input
              className="example-title-input"
              value={item.title || ''}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="כותרת..."
            />
            <textarea
              className="example-desc-input"
              value={item.description || ''}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="הסבר..."
            />
            <button className="danger example-delete" onClick={onDelete}>מחיקה</button>
          </>
        ) : (
          <>
            <h4 className="example-title">{item.title || 'ללא כותרת'}</h4>
            <p className="example-desc">{item.description || ''}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExamplesPage({ editMode }) {
  const [examples, setExamples] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('examples')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setExamples(loadLocal());
        } else {
          setExamples(data || []);
        }
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (loaded) saveLocal(examples);
  }, [examples, loaded]);

  const updateExample = (id, patch) => {
    setExamples(prev => {
      const updated = prev.map(ex => ex.id === id ? { ...ex, ...patch } : ex);
      const item = updated.find(ex => ex.id === id);
      if (item) {
        supabase.from('examples').upsert(item).then(() => {});
      }
      return updated;
    });
  };

  const addExample = (type) => {
    const item = {
      id: crypto.randomUUID(),
      type,
      title: '',
      description: '',
      imageUrl: null,
      created_at: new Date().toISOString(),
    };
    setExamples(prev => [...prev, item]);
    supabase.from('examples').insert(item).then(() => {});
  };

  const deleteExample = (id) => {
    setExamples(prev => prev.filter(ex => ex.id !== id));
    supabase.from('examples').delete().eq('id', id).then(() => {});
  };

  const good = examples.filter(ex => ex.type === 'good');
  const bad = examples.filter(ex => ex.type === 'bad');

  return (
    <section className="examples-page glass-panel">
      <div className="examples-split">
        <div className="examples-column good">
          <div className="examples-col-header good">
            <span className="examples-col-icon">✓</span>
            <h3>דוגמאות טובות</h3>
            {editMode && <button className="primary examples-add" onClick={() => addExample('good')}>+ הוספה</button>}
          </div>
          <div className="examples-grid">
            {good.length === 0 && <p className="muted examples-empty">{editMode ? 'לחצי "הוספה" כדי להוסיף דוגמה טובה' : 'אין דוגמאות'}</p>}
            {good.map(ex => (
              <ExampleCard
                key={ex.id}
                item={ex}
                editMode={editMode}
                onUpdate={patch => updateExample(ex.id, patch)}
                onDelete={() => deleteExample(ex.id)}
              />
            ))}
          </div>
        </div>
        <div className="examples-divider" />
        <div className="examples-column bad">
          <div className="examples-col-header bad">
            <span className="examples-col-icon">✗</span>
            <h3>דוגמאות רעות</h3>
            {editMode && <button className="primary examples-add" onClick={() => addExample('bad')}>+ הוספה</button>}
          </div>
          <div className="examples-grid">
            {bad.length === 0 && <p className="muted examples-empty">{editMode ? 'לחצי "הוספה" כדי להוסיף דוגמה רעה' : 'אין דוגמאות'}</p>}
            {bad.map(ex => (
              <ExampleCard
                key={ex.id}
                item={ex}
                editMode={editMode}
                onUpdate={patch => updateExample(ex.id, patch)}
                onDelete={() => deleteExample(ex.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
