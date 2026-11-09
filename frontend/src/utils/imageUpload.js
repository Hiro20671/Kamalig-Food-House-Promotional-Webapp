/**
 * Universal Mobile Image Processor (OPPO / ColorOS / Android / iOS / Desktop)
 * - Accepts any camera or gallery image regardless of file size (e.g. 50MP/108MP 15MB+ photos)
 *   or missing/non-standard MIME types on Android ColorOS file pickers.
 * - Compresses and resizes large photos client-side to max 1400px JPEG (~200-450 KB)
 *   so mobile uploads succeed quickly and never hit server/proxy upload body limits.
 */

export function validateImageFileClient(file) {
  if (!file) return null;
  if (file.size === 0) {
    return 'Selected photo file is empty. Please try picking the photo again.';
  }
  if (file.size > 35 * 1024 * 1024) {
    return 'Photo exceeds 35MB. Please choose a smaller photo.';
  }
  return null;
}

export async function prepareImageForUpload(file, maxDimension = 1400, quality = 0.84) {
  if (!file || !(file instanceof Blob)) {
    return file;
  }

  const safeBaseName =
    (file.name || 'kamalig_photo')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40) || 'kamalig_photo';

  const lowerName = (file.name || '').toLowerCase();
  if (
    file.size < 600 * 1024 &&
    (lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp'))
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const keepPng = file.type === 'image/png' && file.size < 2 * 1024 * 1024;
        if (!keepPng) {
          ctx.fillStyle = '#101C28';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        const outMime = keepPng ? 'image/png' : 'image/jpeg';
        const outExt = keepPng ? 'png' : 'jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(
                new File([file], `${safeBaseName}.jpg`, {
                  type: file.type || 'image/jpeg',
                  lastModified: Date.now(),
                })
              );
              return;
            }
            const processedFile = new File([blob], `${safeBaseName}.${outExt}`, {
              type: outMime,
              lastModified: Date.now(),
            });
            resolve(processedFile);
          },
          outMime,
          quality
        );
      } catch {
        resolve(
          new File([file], `${safeBaseName}.jpg`, {
            type: file.type || 'image/jpeg',
            lastModified: Date.now(),
          })
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(
        new File([file], `${safeBaseName}.jpg`, {
          type: file.type || 'image/jpeg',
          lastModified: Date.now(),
        })
      );
    };

    img.src = objectUrl;
  });
}
