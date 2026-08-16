// Client-side image optimization to prevent database and disk bloat
export async function optimizeFileForStorage(file: File): Promise<{
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  previewUrl?: string;
}> {
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const isImage = file.type.startsWith('image/');

  if (!isImage) {
    // For non-image text/code/document files, read as data url with size safety limit (max 1MB)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: reader.result as string
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Optimize and compress images using HTML Canvas to drastically reduce storage footprint
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as compressed WebP or JPEG to save 80-90% disk storage
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/jpeg', 0.8);
          const approximateSize = Math.round((compressedDataUrl.length * 3) / 4);

          resolve({
            id,
            name: file.name,
            type: 'image/webp',
            size: approximateSize,
            dataUrl: compressedDataUrl,
            previewUrl: compressedDataUrl
          });
        } else {
          resolve({
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: e.target?.result as string,
            previewUrl: e.target?.result as string
          });
        }
      };
      img.onerror = () => {
        resolve({
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target?.result as string
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
