/**
 * Robust Image Compression Utility
 * Handles client-side image compression with fallback options
 */

export interface CompressionOptions {
  maxSizeKB?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: "jpeg" | "png" | "webp";
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

/**
 * Compress an image file with multiple fallback strategies
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeKB = 500,
    quality = 0.8,
    maxWidth = 2048,
    maxHeight = 2048,
    outputFormat = "jpeg",
  } = options;

  const originalSize = file.size;
  console.log(`=== Starting Compression ===`);
  console.log(
    `Original file: ${file.name}, Size: ${(originalSize / 1024).toFixed(2)}KB`
  );

  try {
    // Strategy 1: Try canvas-based compression
    const canvasResult = await compressWithCanvas(file, {
      maxSizeKB,
      quality,
      maxWidth,
      maxHeight,
      outputFormat,
    });

    if (canvasResult.success && canvasResult.file.size <= maxSizeKB * 1024) {
      console.log(`✅ Canvas compression successful`);
      return {
        ...canvasResult,
        originalSize,
        compressedSize: canvasResult.file.size,
        compressionRatio: originalSize / canvasResult.file.size,
      };
    }

    // Strategy 2: Try quality reduction only
    console.log(`Canvas compression failed, trying quality reduction...`);
    const qualityResult = await compressWithQuality(file, {
      maxSizeKB,
      quality: 0.6,
      outputFormat,
    });

    if (qualityResult.success && qualityResult.file.size <= maxSizeKB * 1024) {
      console.log(`✅ Quality compression successful`);
      return {
        ...qualityResult,
        originalSize,
        compressedSize: qualityResult.file.size,
        compressionRatio: originalSize / qualityResult.file.size,
      };
    }

    // Strategy 3: Return original if all compression fails
    console.log(`⚠️ All compression strategies failed, returning original`);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: true,
      error: "Compression failed, using original file",
    };
  } catch (error) {
    console.error(`❌ Compression error:`, error);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Strategy 1: Canvas-based compression with resizing
 */
async function compressWithCanvas(
  file: File,
  options: CompressionOptions
): Promise<{ file: File; success: boolean }> {
  try {
    const img = await createImageFromFile(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Calculate new dimensions
    let { width, height } = calculateDimensions(
      img.width,
      img.height,
      options.maxWidth || 2048,
      options.maxHeight || 2048
    );

    canvas.width = width;
    canvas.height = height;

    // Draw and compress
    ctx.drawImage(img, 0, 0, width, height);

    const mimeType = `image/${options.outputFormat || "jpeg"}`;
    const quality = options.quality || 0.8;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, success: false });
            return;
          }

          const compressedFile = new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, "")}-compressed.${
              options.outputFormat || "jpg"
            }`,
            { type: mimeType }
          );

          resolve({ file: compressedFile, success: true });
        },
        mimeType,
        quality
      );
    });
  } catch (error) {
    console.error("Canvas compression failed:", error);
    return { file, success: false };
  }
}

/**
 * Strategy 2: Quality-based compression only
 */
async function compressWithQuality(
  file: File,
  options: CompressionOptions
): Promise<{ file: File; success: boolean }> {
  try {
    const img = await createImageFromFile(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Use original dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw with lower quality
    ctx.drawImage(img, 0, 0);

    const mimeType = `image/${options.outputFormat || "jpeg"}`;
    const quality = options.quality || 0.6;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, success: false });
            return;
          }

          const compressedFile = new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, "")}-compressed.${
              options.outputFormat || "jpg"
            }`,
            { type: mimeType }
          );

          resolve({ file: compressedFile, success: true });
        },
        mimeType,
        quality
      );
    });
  } catch (error) {
    console.error("Quality compression failed:", error);
    return { file, success: false };
  }
}

/**
 * Helper: Create image from file
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Helper: Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Resize if needed
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Quick compression for small files
 */
export function quickCompress(
  file: File,
  targetSizeKB: number = 200
): Promise<CompressionResult> {
  return compressImage(file, {
    maxSizeKB: targetSizeKB,
    quality: 0.7,
    maxWidth: 1024,
    maxHeight: 1024,
    outputFormat: "jpeg",
  });
}
