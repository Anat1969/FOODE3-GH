import { useRef, useState } from 'react';
import { uploadFile } from '../supabase.js';
import compressImage from '../utils/compressImage.js';

export default function ImageUpload({ value, onChange, alt }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadToStorage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('ניתן להעלות רק קבצי תמונה');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const { publicUrl } = await uploadFile('foode-images', compressed, { ext: 'jpg' });
      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) uploadToStorage(file);
        e.preventDefault();
        return;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadToStorage(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  return (
    <div
      className={`image-upload ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {uploading ? (
        <div className="image-dropzone uploading">
          <div className="spinner" />
          <p>דוחס ומעלה תמונה...</p>
        </div>
      ) : value ? (
        <div className="image-preview">
          <img src={value} alt={alt || 'תמונת פודטראק'} />
          <div className="image-overlay">
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }}>הסרה</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>החלף</button>
          </div>
        </div>
      ) : (
        <div className="image-dropzone" onClick={() => inputRef.current?.click()}>
          <p>גררי תמונה לכאן, הדביקי (Ctrl+V) או לחצי לבחירה</p>
          <p className="upload-hint">JPG, PNG, GIF, WebP, HEIC · נדחס אוטומטית</p>
        </div>
      )}
      {error && <div className="upload-error">{error}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadToStorage(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
