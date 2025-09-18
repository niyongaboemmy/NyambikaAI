// frontend/src/app/api/tryon/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const RAW_TRYON_BASE_URL =
  process.env.TRYON_API_BASE_URL || "https://tryon-api.com";
// Normalize common typo domain
const TRYON_BASE_URL = RAW_TRYON_BASE_URL.replace(
  "api.tryonapi.com",
  "tryon-api.com"
);
const TRYON_API_KEY =
  process.env.TRYON_API_KEY ||
  process.env.NEXT_TRYON_API_KEY ||
  "ta_d753ea369e7b465986cc26bc5e8620ab";

async function pollStatus(
  statusUrl: string,
  headers: Record<string, string>,
  timeoutMs = 60000,
  intervalMs = 2000
) {
  const start = Date.now();
  let last: any = null;
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(statusUrl, { headers, cache: "no-store" });
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
    await new Promise((res) => setTimeout(res, intervalMs));
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

    // Build outgoing FormData for TryOn API (plural field names)
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
      "x-api-key": String(TRYON_API_KEY),
    };

    // Try multiple base URLs
    const candidates = Array.from(
      new Set([
        TRYON_BASE_URL,
        "https://tryon-api.com",
        "https://api.tryonapi.com",
        "http://localhost:8787",
      ])
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
        const code = e?.cause?.code || e?.code || "";
        if (!["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(code)) {
          throw e;
        }
      }
    }

    if (!submit) {
      return NextResponse.json(
        {
          error: "Unable to reach TryOn API on all candidates",
          details: String(lastNetworkErr),
          candidates,
        },
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
        {
          error: "Failed to create try-on job",
          details: err,
          baseUrl: chosenBase,
        },
        { status: submit.status }
      );
    }

    const { jobId, statusUrl } = await submit.json();
    const absoluteStatusUrl = /^https?:\/\//i.test(statusUrl)
      ? statusUrl
      : `${chosenBase}${statusUrl.startsWith("/") ? "" : "/"}${statusUrl}`;

    const status = await pollStatus(absoluteStatusUrl, headers);

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
    console.error("Error in try-on API route:", e);
    return NextResponse.json(
      { error: "Internal server error", details: String(e) },
      { status: 500 }
    );
  }
}
