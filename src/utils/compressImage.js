const MAX_DIM = 1600;
const QUALITY = 0.85;
const MAX_SIZE = 10 * 1024 * 1024;

export default function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE) {
      reject(new Error('הקובץ גדול מדי (מקסימום 10MB)'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('ניתן להעלות רק קבצי תמונה'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('שגיאה בדחיסת התמונה'));
            return;
          }
          const compressed = new File([blob], file.name?.replace(/\.\w+$/, '.jpg') || 'image.jpg', {
            type: 'image/jpeg',
          });
          resolve(compressed);
        },
        'image/jpeg',
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('פורמט תמונה לא נתמך'));
    };

    img.src = url;
  });
}
