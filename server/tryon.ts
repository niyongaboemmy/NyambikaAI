import type { VirtualTryOnResult } from "./openai";

const TRYON_PROVIDER = (
  process.env.TRYON_PROVIDER || "replicate"
).toLowerCase();
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const TRYON_MODEL = process.env.TRYON_MODEL || "xiong-pku/tryondiffusion"; // configurable
const CLOTHFLOW_URL = process.env.CLOTHFLOW_URL || "http://localhost:8000";

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

  const created = await createRes.json();
  const url = created.urls?.get || created?.url;
  if (!url) {
    return {
      success: false,
      error: "Replicate did not return a prediction URL",
    };
  }

  // Poll for completion
  let status = created.status as string;
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
    const json = await poll.json();
    status = json.status;
    output = json.output;
  }

  if (status !== "succeeded") {
    const err = created?.error || "Replicate prediction failed";
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
  // ClothFlow microservice provider
  if (TRYON_PROVIDER === "clothflow" && CLOTHFLOW_URL) {
    try {
      // Normalize inputs: convert URLs to data URLs to reduce dependency on Python-side HTTP reachability
      const personInput = await toClothFlowInput(customerImageBase64OrUrl);
      const clothInput = await toClothFlowInput(productImageBase64OrUrl);

      if (!personInput || !clothInput) {
        return {
          success: false,
          error: `Missing inputs for ClothFlow: person=${Boolean(personInput)}, cloth=${Boolean(clothInput)}`,
        };
      }

      const res = await fetch(`${CLOTHFLOW_URL.replace(/\/$/, "")}/tryon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: personInput,
          cloth: clothInput,
          // optional knobs can be added here depending on your ClothFlow server
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          error: `ClothFlow error (${res.status}): ${text || res.statusText}`,
        };
      }
      const data = await res.json();
      const base64 = data.tryOnImageBase64 as string | undefined;
      const url = data.tryOnImageUrl || data.output || data.url;
      return {
        success: true,
        // If the service returns base64, ensure consumers receive a data URL
        tryOnImageUrl:
          base64 && !/^data:image\//i.test(base64)
            ? `data:image/jpeg;base64,${base64}`
            : base64 || url,
        recommendations: undefined,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || "ClothFlow request failed",
      };
    }
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
