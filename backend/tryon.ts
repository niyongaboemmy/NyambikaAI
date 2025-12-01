import { processImage } from "./utils/imageProcessor";
import path from "path";
import fs from "fs";

// Prefer VIRTUAL_TRYON_URL if provided, backward compatibility
const VIRTUAL_TRYON_URL =
  process.env.VIRTUAL_TRYON_URL || "https://tryon-api.com";

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

// Normalize for ClothFlow service: prefer sending data URLs to avoid remote fetch issues.
async function toClothFlowInput(val: string): Promise<string> {
  if (/^https?:\/\//i.test(val)) {
    const b64 = await toBase64FromUrl(val);
    return `data:image/jpeg;base64,${b64}`;
  }
  // If already a data URL, pass through; if it's raw base64, let the service decode it.
  return val;
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
      // Process the image (compress and crop)
      const result = await processImage(tempInputPath, tempOutputPath);

      if (result.success && result.outputPath) {
        // Read the processed image and convert to base64
        const base64 = fs.readFileSync(result.outputPath).toString("base64");
        return `data:image/jpeg;base64,${base64}`;
      } else {
        console.error("Image processing failed:", result.error);
        return null;
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

// Python virtual_tryon service integration (supports engines: viton_hd, stable_viton)
async function generateWithVirtualTryOnService(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string
): Promise<VirtualTryOnResult> {
  try {
    // Crop the product image before processing
    let processedProductImage = productImageBase64OrUrl;
    try {
      console.log("Cropping product image for try-on...");
      const croppedImage = await cropProductImageForTryOn(
        productImageBase64OrUrl
      );
      if (croppedImage) {
        processedProductImage = croppedImage;
        console.log("Product image cropped successfully for try-on");
      } else {
        console.log("Product image cropping failed, using original");
      }
    } catch (cropError) {
      console.error("Error cropping product image:", cropError);
      // Continue with original image
    }

    const person = await toClothFlowInput(customerImageBase64OrUrl);
    const cloth = await toClothFlowInput(processedProductImage);

    if (!person || !cloth) {
      return {
        success: false,
        error: `Missing inputs for virtual_tryon: person=${Boolean(
          person
        )}, cloth=${Boolean(cloth)}`,
      };
    }

    const baseUrl = VIRTUAL_TRYON_URL.replace(/\/$/, "");
    const TRYON_API_KEY =
      process.env.TRYON_API_KEY || "ta_26b4774d501b4fa6a03158754bcf4ba0";

    // Create FormData for tryon-api.com
    const formData = new FormData();

    // Convert data URLs to Blobs for FormData
    const personBlob = dataURLtoBlob(person);
    const clothBlob = dataURLtoBlob(cloth);

    formData.append("person_images", personBlob, "person.jpg");
    formData.append("garment_images", clothBlob, "garment.jpg");
    formData.append("fast_mode", "true");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${TRYON_API_KEY}`,
      "x-api-key": TRYON_API_KEY,
    };

    const resp = await fetch(`${baseUrl}/api/v1/tryon`, {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("TryOn API Response Status:", resp.status);
    console.log(
      "TryOn API Response Headers:",
      Object.fromEntries(resp.headers.entries())
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("TryOn API Error Response:", text);
      return {
        success: false,
        error: `virtual_tryon error (${resp.status}): ${
          text || resp.statusText
        }`,
      };
    }

    const data = await resp.json();
    console.log("TryOn API Response Data:", data);

    // Parse the submit response (202 accepted)
    const submitResponse = parseTryOnSubmitResponse(data);

    // Ensure absolute status URL
    const absoluteStatusUrl = /^https?:\/\//i.test(submitResponse.statusUrl)
      ? `${baseUrl}${submitResponse.statusUrl}`
      : `${baseUrl}${submitResponse.statusUrl.startsWith("/") ? "" : "/"}${
          submitResponse.statusUrl
        }`;

    console.log("Polling status URL:", absoluteStatusUrl);

    // Poll for completion
    const totalTimeoutMs = Number(process.env.TRYON_POLL_TIMEOUT_MS || 120000); // Increased to 2 minutes
    const status = await pollTryOnStatus(
      absoluteStatusUrl,
      headers,
      totalTimeoutMs
    );

    console.log("Final status:", status);

    // Handle the final status
    if (status.status === "completed") {
      return {
        success: true,
        tryOnImageUrl: status.imageUrl || status.imageBase64,
        recommendations: {
          fit: "perfect" as const,
          confidence: 0.9,
          notes: "AI-generated virtual try-on completed successfully",
        },
      };
    } else if (status.status === "failed") {
      return {
        success: false,
        error: status.error || status.message || "Try-on generation failed",
      };
    } else {
      // Still processing or timeout - return processing status for frontend to handle
      return {
        success: false,
        error: `Try-on status: ${status.status}`,
        processingStatus: status.status,
        jobId: status.jobId,
        requiresPolling: true,
      };
    }
  } catch (e: any) {
    console.error("Virtual try-on request failed:", e);
    console.error("Error details:", {
      message: e?.message,
      cause: e?.cause,
      code: e?.code,
      stack: e?.stack,
    });
    return {
      success: false,
      error: e?.message || "virtual_tryon request failed",
    };
  }
}

// Helper function to convert data URL to Blob
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Helper for parsing JSON response from TryOn API call
interface TryOnApiResponse {
  status:
    | "completed"
    | "failed"
    | "processing"
    | "queued"
    | "processing_from_queue"
    | "timeout";
  imageUrl?: string;
  imageBase64?: string;
  provider?: string;
  jobId?: string;
  error?: string;
  message?: string;
  errorCode?: string;
  result?: any;
}

interface TryOnSubmitResponse {
  jobId: string;
  statusUrl: string;
  perfSessionId?: string;
}

function parseTryOnApiResponse(data: unknown): TryOnApiResponse {
  const response = data as TryOnApiResponse;

  // Validate required fields
  if (!response.status) {
    throw new Error("Invalid TryOn API response: missing status field");
  }

  // Validate status is one of the expected values
  const validStatuses = [
    "completed",
    "failed",
    "processing",
    "queued",
    "processing_from_queue",
    "timeout",
  ];
  if (!validStatuses.includes(response.status)) {
    throw new Error(
      `Invalid TryOn API response: unknown status '${response.status}'`
    );
  }

  return response;
}

function parseTryOnSubmitResponse(data: unknown): TryOnSubmitResponse {
  const response = data as TryOnSubmitResponse;

  if (!response.jobId || !response.statusUrl) {
    throw new Error(
      "Invalid TryOn API submit response: missing jobId or statusUrl"
    );
  }

  return response;
}

// Poll status function similar to frontend implementation
async function pollTryOnStatus(
  statusUrl: string,
  headers: Record<string, string>,
  timeoutMs = 60000,
  intervalMs = 2000,
  maxIntervalMs = 5000,
  backoffFactor = 1.5
): Promise<TryOnApiResponse> {
  const start = Date.now();
  let last: any = null;
  let currentInterval = intervalMs;

  while (Date.now() - start < timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      Math.min(8000, currentInterval + 3000)
    );

    try {
      const r = await fetch(statusUrl, {
        headers,
        // @ts-ignore - cache option is valid but not in RequestInit type
        cache: "no-store",
        signal: controller.signal,
      });
      const j = await r.json();
      last = j;

      // Parse and validate the response
      const parsedResponse = parseTryOnApiResponse(j);

      if (
        parsedResponse.status &&
        parsedResponse.status !== "processing" &&
        parsedResponse.status !== "queued" &&
        parsedResponse.status !== "processing_from_queue"
      ) {
        return parsedResponse;
      }
    } catch (err: any) {
      // Swallow fetch aborts/timeouts and keep last known state
      last = last || {
        status: "processing",
        message: String(err?.message || err),
      };
    } finally {
      clearTimeout(timeoutId);
    }

    await new Promise((res) => setTimeout(res, currentInterval));
    currentInterval = Math.min(
      maxIntervalMs,
      Math.floor(currentInterval * backoffFactor)
    );
  }

  return (
    last ||
    ({
      status: "timeout",
      message: "Timed out waiting for result",
    } as TryOnApiResponse)
  );
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
