import { processImage } from "./utils/imageProcessor";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { tryOnSessions } from "./shared/schema.dialect";
import { eq } from "drizzle-orm";
import Replicate from "replicate";

// ─── Provider config ────────────────────────────────────────────────────────
// Phase 1 (free): PixelAPI — 100 free credits on signup, no credit card.
//   Sign up at https://pixelapi.dev/app and set PIXELAPI_KEY in backend/.env
// Phase 2 (paid fallback): Replicate IDM-VTON — ~$0.023/image
//   Sign up at https://replicate.com and set REPLICATE_API_TOKEN in backend/.env
const PIXELAPI_BASE = "https://api.pixelapi.dev/v1";
const REPLICATE_MODEL =
  "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";

interface VirtualTryOnResult {
  success: boolean;
  tryOnImageUrl?: string;
  error?: string;
  recommendations?: {
    fit: string;
    confidence: number;
    notes: string;
  };
  processingStatus?: string;
  jobId?: string;
  requiresPolling?: boolean;
}

// function removeDataUrlPrefix(data: string): string {
//   const match = data.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
//   return match ? match[2] : data;
// }

async function toBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

// Convert any input (URL, data URL, raw base64) to a plain base64 string
async function toBase64(val: string): Promise<string> {
  if (/^https?:\/\//i.test(val)) {
    return toBase64FromUrl(val);
  }
  if (val.startsWith("data:")) {
    const match = val.match(/^data:image\/(?:png|jpe?g|webp);base64,(.+)$/i);
    if (!match) throw new Error("Invalid data URL");
    return match[1];
  }
  return val; // already raw base64
}

// Convert any input to a publicly reachable URL (Replicate requires URLs, not base64)
async function toPublicUrl(val: string): Promise<string> {
  if (/^https?:\/\//i.test(val)) return val;
  // Convert raw base64 to data URL
  const b64 = await toBase64(val);
  const buf = Buffer.from(b64, "base64");
  
  // Upload to highly-available image host (catbox.moe)
  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", new Blob([buf], { type: "image/jpeg" }), "image.jpg");

  const resp = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData as any,
  });
  
  if (!resp.ok) throw new Error(`Catbox upload failed: ${resp.status}`);
  return (await resp.text()).trim();
}

// Crop product image for try-on by downloading, processing, and returning as data URL
async function cropProductImageForTryOn(
  imageUrlOrBase64: string
): Promise<string | null> {
  try {
    let imageBuffer: Buffer;

    if (/^https?:\/\//i.test(imageUrlOrBase64)) {
      // Download image from URL
      const response = await fetch(imageUrlOrBase64);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (imageUrlOrBase64.startsWith("data:")) {
      // Handle data URL
      const match = imageUrlOrBase64.match(
        /^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i
      );
      if (match) {
        imageBuffer = Buffer.from(match[2], "base64");
      } else {
        throw new Error("Invalid data URL format");
      }
    } else {
      // Assume base64
      imageBuffer = Buffer.from(imageUrlOrBase64, "base64");
    }

    // Create temp file for processing
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempInputPath = path.join(tempDir, `temp-product-${Date.now()}.jpg`);
    const tempOutputPath = path.join(
      tempDir,
      `temp-product-cropped-${Date.now()}.jpg`
    );

    // Write buffer to temp file
    fs.writeFileSync(tempInputPath, imageBuffer);

    try {
      // Process the image (compress and crop) - skip if OpenAI not available
      if (!process.env.OPENAI_API_KEY) {
        console.log(
          "OpenAI API key not available - skipping image cropping for try-on"
        );
        // Return original image as base64
        const base64 = imageBuffer.toString("base64");
        return `data:image/jpeg;base64,${base64}`;
      }

      const result = await processImage(tempInputPath, tempOutputPath);

      if (result.success && result.outputPath) {
        // Read the processed image and convert to base64
        const base64 = fs.readFileSync(result.outputPath).toString("base64");
        return `data:image/jpeg;base64,${base64}`;
      } else {
        console.error("Image processing failed:", result.error);
        // Return original image as fallback
        const base64 = imageBuffer.toString("base64");
        return `data:image/jpeg;base64,${base64}`;
      }
    } finally {
      // Clean up temp files
      try {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
      } catch (cleanupError) {
        console.warn("Failed to clean up temp files:", cleanupError);
      }
    }
  } catch (error) {
    console.error("Error cropping product image for try-on:", error);
    return null;
  }
}

// ─── Phase 1: PixelAPI (free tier — 100 credits on signup, no credit card) ───
// Docs: https://pixelapi.dev/docs  |  API base: https://api.pixelapi.dev/v1
// Virtual try-on is async: POST → job_id → poll GET until status=completed.
async function tryWithPixelAPI(
  personBase64: string,
  clothBase64: string
): Promise<VirtualTryOnResult> {
  const apiKey = process.env.PIXELAPI_KEY;
  if (!apiKey) throw new Error("PIXELAPI_KEY not set");

  const authHeader = { Authorization: `Bearer ${apiKey}` };

  // ── Step 1: Submit the job ────────────────────────────────────────────────
  const submitResp = await fetch(`${PIXELAPI_BASE}/virtual-tryon`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({
      garment_image: personBase64,   // base64 string (no data: prefix)
      person_image: clothBase64,     // base64 string
      category: "upperbody",
    }),
  });

  if (!submitResp.ok) {
    const text = await submitResp.text();
    throw new Error(`PixelAPI submit error (${submitResp.status}): ${text || submitResp.statusText}`);
  }

  const submitData: any = await submitResp.json();
  const jobId: string | undefined = submitData.job_id;
  if (!jobId) throw new Error("PixelAPI did not return a job_id");

  // ── Step 2: Poll for result ───────────────────────────────────────────────
  const pollUrl = `${PIXELAPI_BASE}/virtual-tryon/jobs/${jobId}`;
  const timeoutMs = 120_000; // 2 min max
  const intervalMs = 3_000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const pollResp = await fetch(pollUrl, { headers: authHeader });
    if (!pollResp.ok) {
      const text = await pollResp.text();
      throw new Error(`PixelAPI poll error (${pollResp.status}): ${text}`);
    }

    const pollData: any = await pollResp.json();

    if (pollData.status === "completed") {
      console.log("PixelAPI completed payload:", JSON.stringify(pollData).substring(0, 500));
      // Try multiple common property names
      const b64: string | undefined = pollData.result_image_b64 || pollData.result_b64 || pollData.image_b64;
      const url: string | undefined = pollData.result_url || pollData.image_url || pollData.url || pollData.output_url || pollData.output;
      
      if (b64) {
        return {
          success: true,
          tryOnImageUrl: `data:image/jpeg;base64,${b64}`,
          recommendations: { fit: "perfect", confidence: 0.9, notes: "Virtual try-on completed via PixelAPI (base64)" },
        };
      } else if (url) {
        return {
          success: true,
          tryOnImageUrl: url,
          recommendations: { fit: "perfect", confidence: 0.9, notes: "Virtual try-on completed via PixelAPI (url)" },
        };
      }
      
      throw new Error(`PixelAPI completed but no image found. Keys: ${Object.keys(pollData).join(",")}`);
    }

    if (pollData.status === "failed" || pollData.status === "error") {
      throw new Error(`PixelAPI job failed: ${pollData.error || pollData.message || "unknown"}`);
    }
    // status === "processing" | "queued" → keep polling
  }

  throw new Error("PixelAPI job timed out after 2 minutes");
}

// ─── Phase 2: Replicate IDM-VTON (~$0.023/image, cheapest commercial option) ──
async function tryWithReplicate(
  personUrl: string,
  clothUrl: string
): Promise<VirtualTryOnResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not set");

  const replicate = new Replicate({ auth: token });

  const output = await replicate.run(REPLICATE_MODEL as `${string}/${string}:${string}`, {
    input: {
      human_img: personUrl,
      garm_img: clothUrl,
      garment_des: "clothing item",
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    },
  });

  // IDM-VTON returns a URL string or array of URL strings
  const rawOutput = output as unknown;
  const imageUrl: string | undefined = Array.isArray(rawOutput)
    ? (rawOutput[0] as string)
    : (rawOutput as string);

  if (!imageUrl) throw new Error("Replicate returned no image");

  return {
    success: true,
    tryOnImageUrl: imageUrl,
    recommendations: {
      fit: "perfect",
      confidence: 0.9,
      notes: "Virtual try-on completed via Replicate IDM-VTON",
    },
  };
}

// ─── Orchestrator: Phase 1 → Phase 2 fallback ────────────────────────────────
async function generateWithVirtualTryOnService(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string
): Promise<VirtualTryOnResult> {
  // Crop product image if possible
  let processedProductImage = productImageBase64OrUrl;
  try {
    const cropped = await cropProductImageForTryOn(productImageBase64OrUrl);
    if (cropped) processedProductImage = cropped;
  } catch (cropError) {
    console.error("Error cropping product image:", cropError);
  }

  // ── Phase 1: PixelAPI (free) ────────────────────────────────────────────────
  if (process.env.PIXELAPI_KEY) {
    try {
      const personB64 = await toBase64(customerImageBase64OrUrl);
      const clothB64 = await toBase64(processedProductImage);
      const result = await tryWithPixelAPI(personB64, clothB64);
      if (result.success) return result;
    } catch (err: any) {
      // Quota exhausted (402) or any other error → fall through to Phase 2
      console.error("PixelAPI failed, falling back to Replicate:", err?.message);
    }
  }

  // ── Phase 2: Replicate IDM-VTON (paid, ~$0.023/image) ──────────────────────
  if (process.env.REPLICATE_API_TOKEN) {
    try {
      // Replicate requires public URLs, not base64 blobs
      const personUrl = await toPublicUrl(customerImageBase64OrUrl);
      const clothUrl = await toPublicUrl(processedProductImage);
      const result = await tryWithReplicate(personUrl, clothUrl);
      if (result.success) return result;
    } catch (err: any) {
      console.error("Replicate try-on failed:", err?.message);
      return { success: false, error: err?.message || "Replicate try-on failed" };
    }
  }

  return {
    success: false,
    error:
      "No try-on provider configured. Set PIXELAPI_KEY (free) or REPLICATE_API_TOKEN in backend/.env",
  };
}

export async function generateVirtualTryOn(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string,
  _productType: string,
  _customerMeasurements?: any
): Promise<VirtualTryOnResult> {
  // Always use the external virtual_tryon API
  return generateWithVirtualTryOnService(
    customerImageBase64OrUrl,
    productImageBase64OrUrl
  );
}

// Async processing function for try-on sessions
export async function processTryOnAsync(
  sessionId: string,
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string,
  productType: string = "general"
): Promise<void> {
  try {
    // Generate virtual try-on
    const result = await generateVirtualTryOn(
      customerImageBase64OrUrl,
      productImageBase64OrUrl,
      productType
    );

    if (result.success) {
      // Update session with successful result
      await db
        .update(tryOnSessions)
        .set({
          tryOnImageUrl: result.tryOnImageUrl,
          fitRecommendation: JSON.stringify(result.recommendations || {}),
          status: "completed",
        })
        .where(eq(tryOnSessions.id, sessionId));
    } else {
      // Update session with failure
      await db
        .update(tryOnSessions)
        .set({
          status: "failed",
          notes: result.error || "Processing failed",
        })
        .where(eq(tryOnSessions.id, sessionId));

      console.error(`Try-on session ${sessionId} failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`Error processing try-on session ${sessionId}:`, error);

    try {
      // Update session with error
      await db
        .update(tryOnSessions)
        .set({
          status: "failed",
          notes: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(tryOnSessions.id, sessionId));
    } catch (dbError) {
      console.error(`Failed to update session ${sessionId} status:`, dbError);
    }
  }
}
