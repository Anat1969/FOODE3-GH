import { useRef, useState } from 'react';

const BASE = import.meta.env.BASE_URL || '/';
const PLACEHOLDER = `${BASE}images/foodtrucks/placeholder.svg`;

export { PLACEHOLDER as IMAGE_PLACEHOLDER };

export default function ImageUpload({ value, onChange, alt }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value || '');

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleFile(item.getAsFile());
        e.preventDefault();
        return;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const applyUrl = () => {
    let trimmed = urlDraft.trim();
    if (trimmed) {
      if (trimmed.startsWith('/images/')) {
        trimmed = `${BASE}${trimmed.slice(1)}`;
      }
      onChange(trimmed);
    }
    setUrlMode(false);
  };

  const hasImage = value && value !== PLACEHOLDER;

  return (
    <div
      className={`image-upload ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {hasImage ? (
        <div className="image-preview">
          <img src={value} alt={alt || 'תמונת פודטראק'} />
          <div className="image-overlay">
            <button type="button" onClick={() => onChange('')}>✗ הסר</button>
            <button type="button" onClick={() => inputRef.current?.click()}>החלף</button>
          </div>
        </div>
      ) : urlMode ? (
        <div className="image-url-input">
          <label>נתיב תמונה</label>
          <input
            type="text"
            dir="ltr"
            placeholder="/images/foodtrucks/example.jpg"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
            autoFocus
          />
          <div className="url-actions">
            <button type="button" className="primary small" onClick={applyUrl}>אישור</button>
            <button type="button" className="small" onClick={() => setUrlMode(false)}>ביטול</button>
          </div>
        </div>
      ) : (
        <div className="image-dropzone" onClick={() => inputRef.current?.click()}>
          <span className="upload-icon">📷</span>
          <p>גררי תמונה, הדביקי (Ctrl+V) או לחצי לבחירה</p>
          <button type="button" className="url-link" onClick={(e) => { e.stopPropagation(); setUrlMode(true); setUrlDraft(value || ''); }}>
            או הזיני נתיב תמונה
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
