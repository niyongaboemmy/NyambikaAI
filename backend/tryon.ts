import type { VirtualTryOnResult } from "./openai";

const TRYON_PROVIDER = (
  process.env.TRYON_PROVIDER || "replicate"
).toLowerCase();
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const TRYON_MODEL = process.env.TRYON_MODEL || "xiong-pku/tryondiffusion"; // configurable
// Prefer VIRTUAL_TRYON_URL if provided, else fall back to CLOTHFLOW_URL for backward compatibility
const VIRTUAL_TRYON_URL =
  process.env.VIRTUAL_TRYON_URL || process.env.CLOTHFLOW_URL || "http://localhost:8000";

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
  productImageBase64OrUrl: string,
  engine: "viton_hd" | "stable_viton" = "viton_hd"
): Promise<VirtualTryOnResult> {
  try {
    const person = await toClothFlowInput(customerImageBase64OrUrl);
    const cloth = await toClothFlowInput(productImageBase64OrUrl);

    if (!person || !cloth) {
      return {
        success: false,
        error: `Missing inputs for virtual_tryon: person=${Boolean(person)}, cloth=${Boolean(cloth)}`,
      };
    }

    const baseUrl = VIRTUAL_TRYON_URL.replace(/\/$/, "");
    const resp = await fetch(`${baseUrl}/api/try-on`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_image: person,
        cloth_image: cloth,
        category: "upper",
        engine,
        use_preset: true,
        seed: 42,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, error: `virtual_tryon error (${resp.status}): ${text || resp.statusText}` };
    }

    const data = (await resp.json()) as {
      success: boolean;
      message?: string;
      result_path?: string;
      error?: string;
    };

    if (!data.success) {
      return { success: false, error: data.error || data.message || "virtual_tryon failed" };
    }

    const path = data.result_path || "";
    const url = /^https?:\/\//i.test(path)
      ? path
      : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    return { success: true, tryOnImageUrl: url };
  } catch (e: any) {
    return { success: false, error: e?.message || "virtual_tryon request failed" };
  }
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
  customerMeasurements?: any,
  options?: { engine?: "viton_hd" | "stable_viton" }
): Promise<VirtualTryOnResult> {
  // Python virtual_tryon microservice provider (new path)
  if ((TRYON_PROVIDER === "clothflow" || TRYON_PROVIDER === "virtual_tryon") && VIRTUAL_TRYON_URL) {
    return generateWithVirtualTryOnService(
      customerImageBase64OrUrl,
      productImageBase64OrUrl,
      options?.engine || "viton_hd"
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
