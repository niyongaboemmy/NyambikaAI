import type { VirtualTryOnResult } from "./openai";

const TRYON_PROVIDER = (
  process.env.TRYON_PROVIDER || "replicate"
).toLowerCase();
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const TRYON_MODEL = process.env.TRYON_MODEL || "xiong-pku/tryondiffusion"; // configurable
// Prefer VIRTUAL_TRYON_URL if provided, backward compatibility
const VIRTUAL_TRYON_URL =
  process.env.VIRTUAL_TRYON_URL || "https://tryon-api.com";

function removeDataUrlPrefix(data: string): string {
  const match = data.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
  return match ? match[2] : data;
}

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

// Python virtual_tryon service integration (supports engines: viton_hd, stable_viton)
async function generateWithVirtualTryOnService(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string
): Promise<VirtualTryOnResult> {
  try {
    const person = await toClothFlowInput(customerImageBase64OrUrl);
    const cloth = await toClothFlowInput(productImageBase64OrUrl);

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
      process.env.TRYON_API_KEY || "ta_d753ea369e7b465986cc26bc5e8620ab";

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

async function generateWithReplicate(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string
): Promise<VirtualTryOnResult> {
  if (!REPLICATE_API_TOKEN) {
    return {
      success: false,
      error: "REPLICATE_API_TOKEN is not set",
    };
  }

  // Normalize to base64 data URLs where possible
  let personB64 = customerImageBase64OrUrl;
  let clothB64 = productImageBase64OrUrl;
  if (/^https?:\/\//i.test(personB64))
    personB64 = await toBase64FromUrl(personB64);
  if (/^data:image\//i.test(personB64))
    personB64 = removeDataUrlPrefix(personB64);
  if (/^https?:\/\//i.test(clothB64))
    clothB64 = await toBase64FromUrl(clothB64);
  if (/^data:image\//i.test(clothB64)) clothB64 = removeDataUrlPrefix(clothB64);

  // Many try-on models on Replicate accept keys like person_image/garment_image or human/cloth.
  // We'll send multiple commonly used aliases so it works across popular models.
  const inputs: Record<string, any> = {
    person_image: `data:image/jpeg;base64,${personB64}`,
    garment_image: `data:image/jpeg;base64,${clothB64}`,
    human: `data:image/jpeg;base64,${personB64}`,
    cloth: `data:image/jpeg;base64,${clothB64}`,
    seed: 42,
    num_inference_steps: 30,
    guidance_scale: 4.5,
  };

  // Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
    },
    body: JSON.stringify({
      version: TRYON_MODEL, // Some Replicate models use model/version; keeping as env configurable
      input: inputs,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return { success: false, error: `Replicate create failed: ${text}` };
  }

  interface ReplicatePrediction {
    urls?: { get?: string };
    url?: string;
    status?: string;
    output?: any;
    error?: string;
  }
  const created = (await createRes.json()) as ReplicatePrediction;
  const url = created.urls?.get || created.url;
  if (!url) {
    return {
      success: false,
      error: "Replicate did not return a prediction URL",
    };
  }

  // Poll for completion
  let status = (created.status || "queued") as string;
  let output: any = created.output;
  const maxWaitMs = 90_000;
  const start = Date.now();

  while (["starting", "processing", "queued"].includes(status)) {
    if (Date.now() - start > maxWaitMs) {
      return { success: false, error: "Replicate prediction timed out" };
    }
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(url, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });
    if (!poll.ok) break;
    const json = (await poll.json()) as ReplicatePrediction;
    status = (json.status || status) as string;
    output = json.output ?? output;
  }

  if (status !== "succeeded") {
    const err = created.error || "Replicate prediction failed";
    return { success: false, error: err };
  }

  // Output can be a single URL or an array of URLs
  const outUrl = Array.isArray(output) ? output[output.length - 1] : output;
  return {
    success: true,
    tryOnImageUrl: typeof outUrl === "string" ? outUrl : undefined,
  };
}

export async function generateVirtualTryOn(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string,
  productType: string,
  customerMeasurements?: any
): Promise<VirtualTryOnResult> {
  // Python virtual_tryon microservice provider (new path)
  if (
    (TRYON_PROVIDER === "clothflow" || TRYON_PROVIDER === "virtual_tryon") &&
    VIRTUAL_TRYON_URL
  ) {
    return generateWithVirtualTryOnService(
      customerImageBase64OrUrl,
      productImageBase64OrUrl
    );
  }

  // Prefer Replicate provider if configured; otherwise fall back to existing OpenAI-based logic
  if (TRYON_PROVIDER === "replicate" && REPLICATE_API_TOKEN) {
    return generateWithReplicate(
      customerImageBase64OrUrl,
      productImageBase64OrUrl
    );
  }

  // Lazy import existing OpenAI path to avoid circular deps
  const { generateVirtualTryOn: openAIVTO } = await import("./openai");
  return openAIVTO(
    customerImageBase64OrUrl,
    productImageBase64OrUrl,
    productType,
    customerMeasurements
  );
}
