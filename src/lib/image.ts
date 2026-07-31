/**
 * Client-side image downscaling for avatars.
 *
 * Avatars used to be stored as raw base64 of the original upload — about
 * 142 KB each, which is what pushed data.json past 8 MB. Resizing to a square
 * thumbnail brings each one down to a few kilobytes.
 */

const DEFAULT_MAX_SIZE = 256;
const DEFAULT_QUALITY = 0.8;

export async function compressImageToDataUrl(
  file: File,
  maxSize: number = DEFAULT_MAX_SIZE,
  quality: number = DEFAULT_QUALITY
): Promise<string> {
  const originalDataUrl = await readAsDataUrl(file);

  // SVG and other vector formats do not survive a canvas round-trip.
  if (!/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.type)) {
    return originalDataUrl;
  }

  try {
    const image = await loadImage(originalDataUrl);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));

    // Already small enough: keep the original bytes.
    if (scale >= 1 && originalDataUrl.length < 40_000) return originalDataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    if (!context) return originalDataUrl;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL('image/jpeg', quality);

    return compressed.length < originalDataUrl.length ? compressed : originalDataUrl;
  } catch {
    return originalDataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode image'));
    image.src = src;
  });
}
