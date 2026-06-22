import { useRef, useState } from 'react';
import { supabase } from '../supabase.js';

const SUPABASE_URL = 'https://qgdubavuvvnpasgijyrk.supabase.co';

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
      const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
      onChange(publicUrl);
    } catch (err) {
      console.error('Storage upload error:', err);
      setError('שגיאה בהעלאה – שומר כ-base64');
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target.result);
      reader.readAsDataURL(file);
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
          <p>מעלה תמונה...</p>
        </div>
      ) : value ? (
        <div className="image-preview">
          <img src={value} alt={alt || 'תמונת פודטראק'} />
          <div className="image-overlay">
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }}>✗ הסר</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>החלף</button>
          </div>
        </div>
      ) : (
        <div className="image-dropzone" onClick={() => inputRef.current?.click()}>
          <span className="upload-icon">📷</span>
          <p>גררי תמונה לכאן, הדביקי (Ctrl+V) או לחצי לבחירה</p>
          <p className="upload-hint">JPG, PNG, GIF, WebP עד 5MB</p>
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
