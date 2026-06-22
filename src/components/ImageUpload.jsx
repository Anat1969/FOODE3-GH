import { useRef, useState } from 'react';

export default function ImageUpload({ value, onChange, alt }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

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

  return (
    <div
      className={`image-upload ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {value ? (
        <div className="image-preview">
          <img src={value} alt={alt || 'תמונת פודטראק'} />
          <div className="image-overlay">
            <button type="button" onClick={() => onChange('')}>✗ הסר</button>
            <button type="button" onClick={() => inputRef.current?.click()}>החלף</button>
          </div>
        </div>
      ) : (
        <div className="image-dropzone" onClick={() => inputRef.current?.click()}>
          <span className="upload-icon">📷</span>
          <p>גררי תמונה, הדביקי (Ctrl+V) או לחצי לבחירה</p>
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
