import { useRef, useState } from 'react';
import { supabase } from '../supabase.js';

const SUPABASE_URL = 'https://qgdubavuvvnpasgijyrk.supabase.co';

export default function ImageUpload({ value, onChange, alt }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadToStorage = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const ext = file.name?.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
      onChange(publicUrl);
    } catch (err) {
      console.error('Upload failed, falling back to base64:', err);
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
        uploadToStorage(item.getAsFile());
        e.preventDefault();
        return;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadToStorage(file);
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
      {uploading ? (
        <div className="image-dropzone">
          <div className="spinner" style={{ width: 24, height: 24 }} />
          <p>מעלה תמונה...</p>
        </div>
      ) : value ? (
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadToStorage(file);
        }}
      />
    </div>
  );
}
