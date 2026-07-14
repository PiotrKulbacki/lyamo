'use client';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const WEBP_QUALITY = 0.85;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('scanner.errors.invalidFile'));
    };

    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('scanner.errors.invalidFile'));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function compressReceiptImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    const image = await loadImageFromFile(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const prefersWebp = typeof canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const outputMime = prefersWebp ? 'image/webp' : 'image/jpeg';
    const outputQuality = prefersWebp ? WEBP_QUALITY : JPEG_QUALITY;
    const blob = await canvasToBlob(canvas, outputMime, outputQuality);

    const extension = prefersWebp ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'receipt';

    return new File([blob], `${baseName}.${extension}`, {
      type: outputMime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
