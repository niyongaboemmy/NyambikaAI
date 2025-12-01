import Jimp from "jimp";
import path from "path";
import fs from "fs";
import { OpenAI } from "openai";

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn("OpenAI client initialization failed:", error);
  openai = null;
}

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: "jpeg" | "png" | "webp";
}

export interface CropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ImageProcessingResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  metadata?: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    dimensions: { width: number; height: number };
  };
}

/**
 * Compress an image file
 */
export async function compressImage(
  inputPath: string,
  outputPath: string,
  options: CompressionOptions = {}
): Promise<ImageProcessingResult> {
  try {
    const {
      quality = 80,
      maxWidth = 1920,
      maxHeight = 1080,
      format = "jpeg",
    } = options;

    // Get original file stats
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;

    const image = await Jimp.read(inputPath);

    // Resize if needed
    if (image.bitmap.width > maxWidth || image.bitmap.height > maxHeight) {
      image.resize(maxWidth, maxHeight);
    }

    // Compress based on format
    if (format === "jpeg") {
      image.quality(quality);
    } else if (format === "png") {
      // Jimp PNG quality is compression level 0-9 (0 = no compression, 9 = max)
      image.quality(Math.round((100 - quality) / 10));
    } else {
      // webp not supported by Jimp, fallback to jpeg
      image.quality(quality);
    }

    // Save
    await image.writeAsync(outputPath);

    // Get new file stats
    const newStats = fs.statSync(outputPath);
    const processedSize = newStats.size;

    return {
      success: true,
      outputPath,
      metadata: {
        originalSize,
        processedSize,
        compressionRatio: originalSize / processedSize,
        dimensions: {
          width: image.bitmap.width,
          height: image.bitmap.height,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown compression error",
    };
  }
}

/**
 * Use OpenAI Vision to detect the main subject and suggest crop coordinates
 */
export async function detectSubjectForCropping(
  imagePath: string
): Promise<CropOptions | null> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      console.warn("OpenAI client not available - skipping subject detection");
      return null;
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not set - skipping subject detection");
      return null;
    }

    // Convert image to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = getMimeTypeFromPath(imagePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyze this image and identify the main subject (person, object, or focal point). Provide the bounding box coordinates for cropping to focus on the main subject. Return only JSON in this format: {"left": number, "top": number, "width": number, "height": number} where coordinates are relative (0-1) to image dimensions.',
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Parse JSON response
    const cropData = JSON.parse(content.trim());
    return cropData as CropOptions;
  } catch (error) {
    console.error("Error detecting subject for cropping:", error);
    // Return null instead of throwing to allow graceful fallback
    return null;
  }
}

/**
 * Crop an image using Jimp
 */
export async function cropImage(
  inputPath: string,
  outputPath: string,
  cropOptions: CropOptions
): Promise<ImageProcessingResult> {
  try {
    const image = await Jimp.read(inputPath);
    const imgWidth = image.bitmap.width;
    const imgHeight = image.bitmap.height;

    // Convert relative coordinates to absolute pixels
    const left = Math.round(cropOptions.left * imgWidth);
    const top = Math.round(cropOptions.top * imgHeight);
    const width = Math.round(cropOptions.width * imgWidth);
    const height = Math.round(cropOptions.height * imgHeight);

    // Ensure crop area is within bounds
    const safeLeft = Math.max(0, left);
    const safeTop = Math.max(0, top);
    const safeWidth = Math.min(width, imgWidth - safeLeft);
    const safeHeight = Math.min(height, imgHeight - safeTop);

    image.crop(safeLeft, safeTop, safeWidth, safeHeight);

    await image.writeAsync(outputPath);

    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    const newStats = fs.statSync(outputPath);
    const processedSize = newStats.size;

    return {
      success: true,
      outputPath,
      metadata: {
        originalSize,
        processedSize,
        compressionRatio: originalSize / processedSize,
        dimensions: { width: safeWidth, height: safeHeight },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown cropping error",
    };
  }
}

/**
 * Process image: compress then crop
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  compressionOptions?: CompressionOptions
): Promise<ImageProcessingResult> {
  try {
    // Step 1: Compress the image
    const tempCompressedPath = `${outputPath}.temp`;
    const compressionResult = await compressImage(
      inputPath,
      tempCompressedPath,
      compressionOptions
    );

    if (!compressionResult.success) {
      return compressionResult;
    }

    // Step 2: Detect subject and crop
    const cropOptions = await detectSubjectForCropping(tempCompressedPath);

    if (cropOptions) {
      const cropResult = await cropImage(
        tempCompressedPath,
        outputPath,
        cropOptions
      );

      // Clean up temp file
      try {
        fs.unlinkSync(tempCompressedPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (cropResult.success) {
        return cropResult;
      }
    }

    // If cropping failed or no subject detected, just return the compressed version
    fs.renameSync(tempCompressedPath, outputPath);

    return {
      success: true,
      outputPath,
      metadata: compressionResult.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown processing error",
    };
  }
}

/**
 * Get MIME type from file path
 */
function getMimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "image/jpeg";
}
