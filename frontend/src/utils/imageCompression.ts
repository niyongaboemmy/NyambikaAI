/*
 Utility: Image compression and download + compress helpers

 Exports:
 - compressImageFile(file, options): Promise<File | Blob>
 - downloadAndCompressImage(url, options): Promise<File | Blob>

 Notes:
 - Uses Canvas and browser encoders (JPEG/WebP) to reduce dimensions and quality.
 - Supports target max size (in KB). Will iteratively reduce quality and, if needed, dimensions.
 - CORS: downloadAndCompressImage() requires the source server to allow cross-origin image fetching.
*/

export type CompressReturnType = 'file' | 'blob';

export interface CompressOptions {
  // Target maximum size in KB. If omitted, only one encode pass runs using provided quality.
  maxSizeKB?: number;
  // Preferred output MIME type. Generally 'image/jpeg' or 'image/webp'. Defaults to 'image/jpeg'.
  mimeType?: 'image/jpeg' | 'image/webp';
  // Initial quality between 0 and 1. The algorithm may lower it to meet size target. Default 0.8.
  quality?: number;
  // Max width/height to downscale to. If omitted, keeps original dimensions unless size target demands further downscale.
  maxWidth?: number;
  maxHeight?: number;
  // If true, will aggressively downscale in steps when size cannot be met by quality alone. Default true.
  allowDownscale?: boolean;
  // Return a File (default) or Blob
  returnType?: CompressReturnType;
  // Optional filename for the returned File. If not provided, a derived name will be used.
  outputFilename?: string;
}

const DEFAULTS: Required<Pick<CompressOptions, 'mimeType' | 'quality' | 'allowDownscale' | 'returnType'>> = {
  mimeType: 'image/jpeg',
  quality: 0.8,
  allowDownscale: true,
  returnType: 'file',
};

function getExtForMime(mime: string): string {
  if (mime === 'image/webp') return 'webp';
  // Default to jpeg ext
  return 'jpg';
}

function deriveOutputName(inputName: string | undefined, mimeType: CompressOptions['mimeType']): string {
  const base = (inputName?.split('/')?.pop() || 'image').replace(/\.[^.]+$/, '');
  const ext = getExtForMime(mimeType || 'image/jpeg');
  return `${base}-compressed.${ext}`;
}

function getTargetDimensions(
  srcW: number,
  srcH: number,
  maxW?: number,
  maxH?: number
): { width: number; height: number } {
  if (!maxW && !maxH) return { width: srcW, height: srcH };
  const ratio = srcW / srcH;
  let width = srcW;
  let height = srcH;

  if (maxW && width > maxW) {
    width = maxW;
    height = Math.round(width / ratio);
  }
  if (maxH && height > maxH) {
    height = maxH;
    width = Math.round(height * ratio);
  }
  return { width, height };
}

async function blobToImageBitmapOrImage(blob: Blob): Promise<{ img: ImageBitmap | HTMLImageElement; width: number; height: number; revoke?: () => void }>{
  if ('createImageBitmap' in window) {
    const bmp = await createImageBitmap(blob);
    return { img: bmp, width: bmp.width, height: bmp.height, revoke: () => bmp.close?.() };
  }
  // Fallback to HTMLImageElement
  const url = URL.createObjectURL(blob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = (e) => reject(e);
    i.src = url;
    // Attempt to use anonymous to avoid taint when same-origin or CORS-enabled
    i.crossOrigin = 'anonymous';
  });
  return { img, width: img.naturalWidth, height: img.naturalHeight, revoke: () => URL.revokeObjectURL(url) };
}

function drawImageToCanvas(source: ImageBitmap | HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.drawImage(source as any, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to create blob from canvas'));
      resolve(blob);
    }, type, quality);
  });
}

async function encodeWithParams(
  source: ImageBitmap | HTMLImageElement,
  srcW: number,
  srcH: number,
  options: Required<Pick<CompressOptions, 'mimeType' | 'quality'>> & { width?: number; height?: number }
): Promise<Blob> {
  const { width, height } = options.width && options.height
    ? { width: options.width, height: options.height }
    : { width: srcW, height: srcH };
  const canvas = drawImageToCanvas(source, width, height);
  const blob = await canvasToBlob(canvas, options.mimeType, options.quality);
  return blob;
}

function asFileOrBlob(blob: Blob, name: string, type: string, returnType: CompressReturnType): File | Blob {
  if (returnType === 'blob') return blob;
  return new File([blob], name, { type });
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<File | Blob> {
  const { mimeType, quality, allowDownscale, returnType } = { ...DEFAULTS, ...options };
  const maxBytes = (options.maxSizeKB ?? 0) > 0 ? (options.maxSizeKB as number) * 1024 : undefined;
  const outputName = options.outputFilename || deriveOutputName(file.name, mimeType);

  // If file is already smaller than target and mime is acceptable, early return
  if (maxBytes && file.size <= maxBytes && file.type === mimeType) {
    return returnType === 'blob' ? file.slice(0, file.size, file.type) : new File([file], outputName, { type: file.type });
  }

  const initialBlob = file as Blob;
  const { img, width: srcW, height: srcH, revoke } = await blobToImageBitmapOrImage(initialBlob);
  try {
    // First pass: optional initial downscale to maxWidth/maxHeight
    let targetDims = getTargetDimensions(srcW, srcH, options.maxWidth, options.maxHeight);
    let currentQuality = quality;
    let encoded = await encodeWithParams(img, srcW, srcH, { mimeType, quality: currentQuality, width: targetDims.width, height: targetDims.height });

    if (!maxBytes) {
      // No size target; just return the single-pass encode
      return asFileOrBlob(encoded, outputName, mimeType, returnType);
    }

    // Iterate: reduce quality until under target or min quality
    while (encoded.size > maxBytes && currentQuality > 0.2) {
      currentQuality = Math.max(0.2, currentQuality * 0.85);
      encoded = await encodeWithParams(img, srcW, srcH, { mimeType, quality: currentQuality, width: targetDims.width, height: targetDims.height });
    }

    // If still too big and downscale allowed, reduce dimensions gradually
    if (encoded.size > maxBytes && allowDownscale) {
      let scale = 0.9; // step down by 10% each iteration
      let attempts = 0;
      while (encoded.size > maxBytes && attempts < 10) {
        attempts += 1;
        targetDims = { width: Math.max(16, Math.round(targetDims.width * scale)), height: Math.max(16, Math.round(targetDims.height * scale)) };
        // Slightly reset quality upwards to avoid over-degradation, but clamp to initial
        currentQuality = Math.min(quality, currentQuality * 1.05);
        encoded = await encodeWithParams(img, srcW, srcH, { mimeType, quality: currentQuality, width: targetDims.width, height: targetDims.height });
        // After each downscale, if still big, reduce quality a bit
        if (encoded.size > maxBytes && currentQuality > 0.25) {
          currentQuality = Math.max(0.25, currentQuality * 0.9);
        }
      }
    }

    return asFileOrBlob(encoded, outputName, mimeType, returnType);
  } finally {
    revoke?.();
  }
}

export async function downloadAndCompressImage(
  url: string,
  options: CompressOptions = {}
): Promise<File | Blob> {
  const { mimeType, returnType } = { ...DEFAULTS, ...options };

  // Fetch the image as a Blob. Note: This requires CORS to be permitted by the remote server.
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Failed to fetch image. HTTP ${res.status}`);
  const blob = await res.blob();

  // Derive a filename from URL if not provided
  const outputName = options.outputFilename || deriveOutputName(url, mimeType);

  // Convert to File temporarily to reuse compressImageFile implementation
  const tempFile = new File([blob], outputName, { type: blob.type || 'application/octet-stream' });
  const result = await compressImageFile(tempFile, { ...options, outputFilename: outputName, mimeType, returnType });
  return result;
}
