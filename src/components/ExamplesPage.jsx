import { useState, useRef, useEffect } from 'react';
import { uploadFile } from '../supabase.js';
import useRecords from '../hooks/useRecords.js';
import compressImage from '../utils/compressImage.js';

function ExampleCard({ item, onUpdate, onDelete, editMode }) {
  const fileRef = useRef(null);
  const [draft, setDraft] = useState({ title: item.title || '', description: item.description || '' });
  useEffect(() => { setDraft({ title: item.title || '', description: item.description || '' }); }, [item.title, item.description]);
  const commit = (key) => { if ((item[key] || '') !== draft[key]) onUpdate({ [key]: draft[key] }); };
  const [uploading, setUploading] = useState(false);

  const [uploadError, setUploadError] = useState(null);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const compressed = await compressImage(file);
      const { publicUrl } = await uploadFile('foode-images', compressed, { folder: 'examples', ext: 'jpg' });
      onUpdate({ imageUrl: publicUrl });
    } catch (err) {
      setUploadError(err.message || 'שגיאה בהעלאה');
    }
    setUploading(false);
  };

  return (
    <div className="example-card panel">
      <div className="example-image-wrap">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title || 'דוגמה'} className="example-image" />
        ) : (
          <div className="example-image-placeholder">
            {''}
          </div>
        )}
        {editMode && (
          <>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            <button className="example-upload-btn" aria-label="העלאת תמונה" title="העלאת תמונה" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? '…' : '+'}
            </button>
            {uploadError && <div className="upload-error" style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 11 }}>{uploadError}</div>}
          </>
        )}
      </div>
      <div className="example-content">
        {editMode ? (
          <>
            <input
              className="example-title-input"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              onBlur={() => commit('title')}
              placeholder="כותרת"
            />
            <button className="icon-btn remove example-delete" aria-label="הסרת הדוגמה" title="הסרה" onClick={() => { if (window.confirm('להסיר את הדוגמה?')) onDelete(); }}>×</button>
          </>
        ) : (
          <>
            <h4 className="example-title">{item.title || 'ללא כותרת'}</h4>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExamplesPage({ editMode, onError }) {
  const { rows: examples, save, remove } = useRecords('examples', { onError });

  const updateExample = (id, patch) => { save(id, patch).catch(() => {}); };

  const addExample = (type) => {
    save(crypto.randomUUID(), { type, title: '', description: '', imageUrl: null }).catch(() => {});
  };

  const deleteExample = (id) => remove(id);

  const good = examples.filter(ex => ex.type === 'good');
  const bad = examples.filter(ex => ex.type === 'bad');

  return (
    <section className="examples-page panel">
      <div className="examples-split">
        <div className="examples-column good">
          <div className="examples-col-header good">
            <h3>דוגמאות טובות</h3>
            {editMode && <button className="icon-btn add examples-add" aria-label="הוספת דוגמה טובה" title="הוספה" onClick={() => addExample('good')}>+</button>}
          </div>
          <div className="examples-grid">
            {good.length === 0 && <p className="muted examples-empty">אין</p>}
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
            <h3>דוגמאות רעות</h3>
            {editMode && <button className="icon-btn add examples-add" aria-label="הוספת דוגמה רעה" title="הוספה" onClick={() => addExample('bad')}>+</button>}
          </div>
          <div className="examples-grid">
            {bad.length === 0 && <p className="muted examples-empty">אין</p>}
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
