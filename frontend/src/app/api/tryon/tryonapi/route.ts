import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RAW_TRYON_BASE_URL = process.env.TRYON_API_BASE_URL || "https://tryon-api.com";
// Normalize common typo domain (api.tryonapi.com -> tryon-api.com)
const TRYON_BASE_URL = RAW_TRYON_BASE_URL.replace("api.tryonapi.com", "tryon-api.com");
const TRYON_API_KEY = process.env.TRYON_API_KEY || process.env.NEXT_TRYON_API_KEY;

async function pollStatus(
  statusUrl: string,
  headers: Record<string, string>,
  timeoutMs = 60000,
  intervalMs = 2000,
  maxIntervalMs = 5000,
  backoffFactor = 1.5
) {
  const start = Date.now();
  let last: any = null;
  let currentInterval = intervalMs;
  while (Date.now() - start < timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(8000, currentInterval + 3000));
    try {
      const r = await fetch(statusUrl, { headers, cache: "no-store", signal: controller.signal });
      const j = await r.json();
      last = j;
      if (
        j.status &&
        j.status !== "processing" &&
        j.status !== "queued" &&
        j.status !== "processing_from_queue"
      ) {
        return j;
      }
    } catch (err: any) {
      // Swallow fetch aborts/timeouts and keep last known state
      last = last || { status: "processing", message: String(err?.message || err) };
    } finally {
      clearTimeout(timeoutId);
    }
    await new Promise((res) => setTimeout(res, currentInterval));
    currentInterval = Math.min(maxIntervalMs, Math.floor(currentInterval * backoffFactor));
  }
  return last || { status: "timeout", message: "Timed out waiting for result" };
}

export async function POST(req: Request) {
  try {
    if (!TRYON_API_KEY) {
      return NextResponse.json(
        { error: "TRYON_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const waitParam = url.searchParams.get("wait");
    const waitForCompletion = waitParam === null ? true : waitParam !== "false";
    const incoming = await req.formData();
    const person = incoming.get("person_image") as File | null;
    const garment = incoming.get("garment_image") as File | null;
    const fastModeRaw = incoming.get("fast_mode");
    const fast_mode =
      fastModeRaw === "true" || Boolean(fastModeRaw) === true ? true : false;

    if (!person || !garment) {
      return NextResponse.json(
        { error: "Both person_image and garment_image are required" },
        { status: 400 }
      );
    }

    // Basic file size validation to avoid oversized payloads (10MB each default)
    const MAX_BYTES = Number(process.env.TRYON_MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
    const personSize = (person as any)?.size ?? 0;
    const garmentSize = (garment as any)?.size ?? 0;
    if (personSize > MAX_BYTES || garmentSize > MAX_BYTES) {
      return NextResponse.json(
        {
          error: "File too large",
          details: `Max per-file size is ${Math.floor(MAX_BYTES / (1024 * 1024))}MB`,
        },
        { status: 413 }
      );
    }

    const out = new FormData();
    out.append("person_images", person, (person as any).name || "person.jpg");
    out.append(
      "garment_images",
      garment,
      (garment as any).name || "garment.jpg"
    );
    if (typeof fast_mode === "boolean")
      out.append("fast_mode", String(fast_mode));

    const headers: Record<string, string> = {
      Authorization: `Bearer ${TRYON_API_KEY}`,
      "x-api-key": TRYON_API_KEY,
    };

    // Try multiple base URLs in case one is unreachable in current network/DNS
    const includeLocal = process.env.NODE_ENV !== "production";
    const candidates = Array.from(
      new Set(
        [
          TRYON_BASE_URL,
          "https://tryon-api.com",
          "https://api.tryonapi.com",
          includeLocal ? "http://localhost:8787" : undefined,
        ].filter(Boolean) as string[]
      )
    );

    let submit: Response | null = null;
    let chosenBase = TRYON_BASE_URL;
    let lastNetworkErr: any = null;
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/api/v1/tryon`, {
          method: "POST",
          headers,
          body: out,
        });
        submit = res;
        chosenBase = base;
        break;
      } catch (e: any) {
        lastNetworkErr = e;
        // Only continue on network resolution/connectivity errors
        const code = e?.cause?.code || e?.code || "";
        if (!["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(code)) {
          // Non-network error: stop trying
          throw e;
        }
        // Try next candidate
      }
    }

    if (!submit) {
      return NextResponse.json(
        { error: "Unable to reach TryOn API on all candidates", details: String(lastNetworkErr), candidates },
        { status: 502 }
      );
    }

    if (submit.status === 401 || submit.status === 403) {
      const err = await submit.text();
      return NextResponse.json(
        { error: "Unauthorized to use TryOn API", details: err },
        { status: submit.status }
      );
    }

    if (submit.status === 402) {
      const err = await submit.text();
      return NextResponse.json(
        { error: "Insufficient credits", details: err },
        { status: 402 }
      );
    }

    if (submit.status !== 202) {
      const err = await submit.text();
      return NextResponse.json(
        { error: "Failed to create try-on job", details: err, baseUrl: chosenBase },
        { status: submit.status }
      );
    }

    const { jobId, statusUrl } = await submit.json();

    // Ensure absolute status URL
    const absoluteStatusUrl = /^https?:\/\//i.test(statusUrl)
      ? statusUrl
      : `${chosenBase}${statusUrl.startsWith("/") ? "" : "/"}${statusUrl}`;

    // If the client opts out of waiting, return immediately with 202 and status URL
    if (!waitForCompletion) {
      return NextResponse.json(
        {
          status: "accepted",
          jobId,
          statusUrl: absoluteStatusUrl,
          message: "Job accepted; client opted out of server-side polling",
        },
        { status: 202 }
      );
    }

    const totalTimeoutMs = Number(process.env.TRYON_POLL_TIMEOUT_MS || 60000);
    const status = await pollStatus(absoluteStatusUrl, headers, totalTimeoutMs);

    if (status.status === "completed") {
      if (status.imageUrl) {
        return NextResponse.json({
          success: true,
          imageUrl: status.imageUrl,
          provider: status.provider,
          jobId,
        });
      }
      if (status.imageBase64) {
        return NextResponse.json({
          success: true,
          imageBase64: status.imageBase64,
          provider: status.provider,
          jobId,
        });
      }
      return NextResponse.json({
        success: true,
        message: "Completed but no image payload returned",
        jobId,
      });
    }

    if (status.status === "failed") {
      return NextResponse.json(
        {
          error: status.error || "Generation failed",
          errorCode: status.errorCode,
          result: status.result,
          jobId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: status.status,
        message: status.message || "Still processing",
        jobId,
      },
      { status: 202 }
    );
  } catch (e: any) {
    console.error("TryOn integration error:", e);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(e),
        baseUrl: TRYON_BASE_URL,
      },
      { status: 500 }
    );
  }
}

