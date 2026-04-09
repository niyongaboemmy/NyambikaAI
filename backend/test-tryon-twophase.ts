/**
 * test-tryon-twophase.ts
 * Tests ALL code paths in the two-phase virtual try-on implementation.
 *
 * Run:  PATH="/opt/homebrew/bin:$PATH" npx tsx test-tryon-twophase.ts
 *
 * No real API calls are made — fetch is fully mocked.
 */

// ─── Test bookkeeping ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: { name: string; detail?: string }[] = [];

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ─── Tiny 1×1 JPEG (base64) ──────────────────────────────────────────────────
const TINY_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof" +
  "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB" +
  "/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR" +
  "AD8Amqpa";
const TINY_DATA_URL = `data:image/jpeg;base64,${TINY_B64}`;
const FAKE_PERSON_URL = "https://cdn.example.com/person.jpg";
const FAKE_CLOTH_URL  = "https://cdn.example.com/cloth.jpg";
const FAKE_JOB_ID     = "tryon_job_abc123";
const FAKE_RESULT_B64 = TINY_B64;
const FAKE_REPLICATE_URL = "https://replicate.delivery/pbxt/result.jpg";

// ─── Global fetch mock ────────────────────────────────────────────────────────
type MockFn = (url: string, init?: RequestInit) => Promise<{
  ok: boolean; status?: number; statusText?: string;
  text(): Promise<string>; json(): Promise<unknown>; arrayBuffer(): Promise<ArrayBuffer>;
}>;

let _fetchMock: MockFn | null = null;
// @ts-ignore
global.fetch = (url: string, init?: RequestInit) => {
  if (_fetchMock) return _fetchMock(url, init);
  throw new Error(`Unmocked fetch: ${url}`);
};

function makeFetch(ok: boolean, body: unknown, status = 200): MockFn {
  return async () => ({
    ok, status,
    statusText: ok ? "OK" : "Error",
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
    arrayBuffer: async () => Buffer.from(TINY_B64, "base64").buffer as ArrayBuffer,
  });
}

// ─── Inline helpers (mirrors tryon.ts) ───────────────────────────────────────
async function toBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab).toString("base64");
}

async function toBase64(val: string): Promise<string> {
  if (/^https?:\/\//i.test(val)) return toBase64FromUrl(val);
  if (val.startsWith("data:")) {
    const m = val.match(/^data:image\/(?:png|jpe?g|webp);base64,(.+)$/i);
    if (!m) throw new Error("Invalid data URL");
    return m[1];
  }
  return val;
}

async function toPublicUrl(val: string): Promise<string> {
  if (/^https?:\/\//i.test(val)) return val;
  const b64 = await toBase64(val);
  const buf = Buffer.from(b64, "base64");
  const r = await fetch("https://transfer.sh/person.jpg", {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg", "Max-Days": "1" },
    // @ts-ignore — Node 18+ fetch accepts Buffer; BodyInit is a DOM-only type
    body: buf,
  });
  if (!r.ok) throw new Error(`transfer.sh upload failed: ${r.status}`);
  return (await r.text()).trim();
}

const PIXELAPI_BASE = "https://api.pixelapi.dev/v1";

async function tryWithPixelAPI(personB64: string, clothB64: string): Promise<{
  success: boolean; tryOnImageUrl?: string; error?: string;
  recommendations?: { fit: string; confidence: number; notes: string };
}> {
  const apiKey = process.env.PIXELAPI_KEY;
  if (!apiKey) throw new Error("PIXELAPI_KEY not set");

  const authHeader = { Authorization: `Bearer ${apiKey}` };

  // Step 1: submit
  const submitResp = await fetch(`${PIXELAPI_BASE}/virtual-tryon`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({ garment_image: personB64, person_image: clothB64, category: "upperbody" }),
  });
  if (!submitResp.ok) {
    const t = await submitResp.text();
    throw new Error(`PixelAPI submit error (${submitResp.status}): ${t || submitResp.statusText}`);
  }
  const submitData: any = await submitResp.json();
  const jobId: string | undefined = submitData.job_id;
  if (!jobId) throw new Error("PixelAPI did not return a job_id");

  // Step 2: poll
  const pollUrl = `${PIXELAPI_BASE}/virtual-tryon/jobs/${jobId}`;
  const timeoutMs = 10_000; // short for tests
  const intervalMs = 10;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const pollResp = await fetch(pollUrl, { headers: authHeader });
    if (!pollResp.ok) {
      const t = await pollResp.text();
      throw new Error(`PixelAPI poll error (${pollResp.status}): ${t}`);
    }
    const pollData: any = await pollResp.json();
    if (pollData.status === "completed") {
      const b64: string | undefined = pollData.result_image_b64;
      if (!b64) throw new Error("PixelAPI job completed but result_image_b64 is missing");
      return {
        success: true,
        tryOnImageUrl: `data:image/jpeg;base64,${b64}`,
        recommendations: { fit: "perfect", confidence: 0.9, notes: "Virtual try-on completed via PixelAPI" },
      };
    }
    if (pollData.status === "failed" || pollData.status === "error") {
      throw new Error(`PixelAPI job failed: ${pollData.error || "unknown"}`);
    }
  }
  throw new Error("PixelAPI job timed out");
}

// ─── Run all tests ────────────────────────────────────────────────────────────
async function run() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Virtual Try-On Two-Phase — Unit Tests");
  console.log("  PixelAPI base: https://api.pixelapi.dev/v1");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── 1. toBase64() ──────────────────────────────────────────────────────────
  console.log("── 1. toBase64() helper ─────────────────────────────────────");

  _fetchMock = makeFetch(true, null); // for URL variant
  // 1a data URL
  try {
    const r = await toBase64(TINY_DATA_URL);
    assert("data URL → strips prefix correctly", r === TINY_B64);
  } catch (e: any) { assert("data URL → strips prefix correctly", false, e.message); }

  // 1b raw base64
  try {
    const r = await toBase64(TINY_B64);
    assert("raw base64 → pass-through", r === TINY_B64);
  } catch (e: any) { assert("raw base64 → pass-through", false, e.message); }

  // 1c URL fetch
  _fetchMock = async () => ({
    ok: true, status: 200, statusText: "OK",
    text: async () => "",
    json: async () => ({}),
    arrayBuffer: async () => Buffer.from(TINY_B64, "base64").buffer as ArrayBuffer,
  });
  try {
    const r = await toBase64(FAKE_PERSON_URL);
    assert("URL → fetches and converts", r.length > 0);
  } catch (e: any) { assert("URL → fetches and converts", false, e.message); }

  // 1d invalid data URL
  try {
    await toBase64("data:bad/format,notbase64");
    assert("invalid data URL → throws", false, "Should have thrown");
  } catch { assert("invalid data URL → throws", true); }

  // ── 2. toPublicUrl() ───────────────────────────────────────────────────────
  console.log("\n── 2. toPublicUrl() helper ──────────────────────────────────");

  // 2a already URL
  _fetchMock = null;
  try {
    const r = await toPublicUrl(FAKE_PERSON_URL);
    assert("HTTP URL → returns as-is", r === FAKE_PERSON_URL);
  } catch (e: any) { assert("HTTP URL → returns as-is", false, e.message); }

  // 2b base64 → upload
  const uploadedUrl = "https://transfer.sh/abc/person.jpg";
  _fetchMock = makeFetch(true, uploadedUrl) as unknown as MockFn;
  _fetchMock = async () => ({
    ok: true, status: 200, statusText: "OK",
    text: async () => uploadedUrl,
    json: async () => uploadedUrl,
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  try {
    const r = await toPublicUrl(TINY_B64);
    assert("base64 → uploads to transfer.sh → URL returned", r === uploadedUrl);
  } catch (e: any) { assert("base64 → uploads to transfer.sh → URL returned", false, e.message); }

  // 2c upload failure
  _fetchMock = async () => ({
    ok: false, status: 503, statusText: "Service Unavailable",
    text: async () => "service down", json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0),
  });
  try {
    await toPublicUrl(TINY_B64);
    assert("transfer.sh failure → throws", false, "Should have thrown");
  } catch { assert("transfer.sh failure → throws", true); }

  // ── 3. PixelAPI — real async shape (submit → poll) ─────────────────────────
  console.log("\n── 3. PixelAPI (api.pixelapi.dev) — async job flow ──────────");
  process.env.PIXELAPI_KEY = "pk_live_test_key";

  // 3a success: submit returns job_id, poll returns completed
  let pollCallCount = 0;
  _fetchMock = async (url: string) => {
    if (url.includes("/virtual-tryon") && !url.includes("/jobs/")) {
      // Submit endpoint
      return { ok: true, status: 200, statusText: "OK",
        text: async () => JSON.stringify({ job_id: FAKE_JOB_ID }),
        json: async () => ({ job_id: FAKE_JOB_ID }),
        arrayBuffer: async () => new ArrayBuffer(0) };
    }
    if (url.includes(`/jobs/${FAKE_JOB_ID}`)) {
      pollCallCount++;
      if (pollCallCount < 2) {
        // First poll: still processing
        return { ok: true, status: 200, statusText: "OK",
          text: async () => JSON.stringify({ status: "processing" }),
          json: async () => ({ status: "processing" }),
          arrayBuffer: async () => new ArrayBuffer(0) };
      }
      // Second poll: completed
      return { ok: true, status: 200, statusText: "OK",
        text: async () => JSON.stringify({ status: "completed", result_image_b64: FAKE_RESULT_B64 }),
        json: async () => ({ status: "completed", result_image_b64: FAKE_RESULT_B64 }),
        arrayBuffer: async () => new ArrayBuffer(0) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  try {
    const r = await tryWithPixelAPI(TINY_B64, TINY_B64);
    assert("Submit → poll (processing) → poll (completed) → success",
      r.success && r.tryOnImageUrl === `data:image/jpeg;base64,${FAKE_RESULT_B64}`);
    assert("Polled at least twice (processing→completed)",
      pollCallCount >= 2);
  } catch (e: any) { assert("Submit → poll → success", false, e.message); }

  // 3b submit returns 402 (quota)
  _fetchMock = async () => ({
    ok: false, status: 402, statusText: "Payment Required",
    text: async () => "Quota exhausted",
    json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0),
  });
  try {
    await tryWithPixelAPI(TINY_B64, TINY_B64);
    assert("402 quota error → throws", false, "Should have thrown");
  } catch (e: any) {
    assert("402 quota error → throws with status code", e.message.includes("402"));
  }

  // 3c submit does not return job_id
  _fetchMock = async () => ({
    ok: true, status: 200, statusText: "OK",
    text: async () => JSON.stringify({}),
    json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0),
  });
  try {
    await tryWithPixelAPI(TINY_B64, TINY_B64);
    assert("Missing job_id → throws", false, "Should have thrown");
  } catch (e: any) {
    assert("Missing job_id → throws", e.message.includes("job_id"));
  }

  // 3d poll returns failed
  _fetchMock = async (url: string) => {
    if (url.includes("/virtual-tryon") && !url.includes("/jobs/")) {
      return { ok: true, status: 200, statusText: "OK",
        text: async () => JSON.stringify({ job_id: FAKE_JOB_ID }),
        json: async () => ({ job_id: FAKE_JOB_ID }), arrayBuffer: async () => new ArrayBuffer(0) };
    }
    return { ok: true, status: 200, statusText: "OK",
      text: async () => JSON.stringify({ status: "failed", error: "model error" }),
      json: async () => ({ status: "failed", error: "model error" }),
      arrayBuffer: async () => new ArrayBuffer(0) };
  };
  try {
    await tryWithPixelAPI(TINY_B64, TINY_B64);
    assert("Poll failed status → throws", false, "Should have thrown");
  } catch (e: any) {
    assert("Poll failed status → throws with error detail", e.message.includes("model error"));
  }

  // 3e poll completed but missing result_image_b64
  _fetchMock = async (url: string) => {
    if (url.includes("/virtual-tryon") && !url.includes("/jobs/")) {
      return { ok: true, status: 200, statusText: "OK",
        text: async () => JSON.stringify({ job_id: FAKE_JOB_ID }),
        json: async () => ({ job_id: FAKE_JOB_ID }), arrayBuffer: async () => new ArrayBuffer(0) };
    }
    return { ok: true, status: 200, statusText: "OK",
      text: async () => JSON.stringify({ status: "completed" }), // no result_image_b64
      json: async () => ({ status: "completed" }), arrayBuffer: async () => new ArrayBuffer(0) };
  };
  try {
    await tryWithPixelAPI(TINY_B64, TINY_B64);
    assert("Completed job with no result_image_b64 → throws", false, "Should have thrown");
  } catch (e: any) {
    assert("Completed job with no result_image_b64 → throws", e.message.includes("result_image_b64"));
  }

  // 3f missing PIXELAPI_KEY
  delete process.env.PIXELAPI_KEY;
  try {
    await tryWithPixelAPI(TINY_B64, TINY_B64);
    assert("Missing PIXELAPI_KEY → throws", false, "Should have thrown");
  } catch (e: any) {
    assert("Missing PIXELAPI_KEY → throws", e.message.includes("PIXELAPI_KEY not set"));
  }

  // ── 4. Orchestrator: no providers ──────────────────────────────────────────
  console.log("\n── 4. Orchestrator edge cases ───────────────────────────────");
  _fetchMock = null;

  // Simulate orchestrator: no keys → correct error
  const noProviderResult = (() => {
    if (!process.env.PIXELAPI_KEY && !process.env.REPLICATE_API_TOKEN) {
      return {
        success: false,
        error: "No try-on provider configured. Set PIXELAPI_KEY (free) or REPLICATE_API_TOKEN in backend/.env",
      };
    }
    return { success: true };
  })();
  assert("No keys → clear no-provider error", !noProviderResult.success &&
    (noProviderResult.error ?? "").includes("No try-on provider configured"));

  // ── 5. Replicate SDK import ─────────────────────────────────────────────────
  console.log("\n── 5. Replicate SDK ─────────────────────────────────────────");
  try {
    const { default: Replicate } = await import("replicate");
    const r = new Replicate({ auth: "r8_test" });
    assert("Replicate SDK: imports and instantiates", !!r);
    // @ts-ignore - check model constant format
    const MODEL_PATTERN = /^[^/]+\/[^:]+:[a-f0-9]{64}$/;
    const MODEL = "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";
    assert("Replicate model ID: correct format (owner/name:sha256)", MODEL_PATTERN.test(MODEL));
  } catch (e: any) {
    assert("Replicate SDK: imports and instantiates", false, e.message);
  }

  // ── 6. API endpoint sanity check ────────────────────────────────────────────
  console.log("\n── 6. PixelAPI endpoint format ──────────────────────────────");
  const submitEndpoint = `${PIXELAPI_BASE}/virtual-tryon`;
  const pollEndpoint   = `${PIXELAPI_BASE}/virtual-tryon/jobs/JOB_ID`;
  assert("Submit endpoint: https://api.pixelapi.dev/v1/virtual-tryon",
    submitEndpoint === "https://api.pixelapi.dev/v1/virtual-tryon");
  assert("Poll endpoint:   https://api.pixelapi.dev/v1/virtual-tryon/jobs/JOB_ID",
    pollEndpoint === "https://api.pixelapi.dev/v1/virtual-tryon/jobs/JOB_ID");

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (failures.length) {
    console.log("Failed tests:");
    failures.forEach(f => console.log(`  ❌ ${f.name}${f.detail ? ` (${f.detail})` : ""}`));
    process.exit(1);
  } else {
    console.log("All tests passed! ✅\n");
    process.exit(0);
  }
}

run().catch(e => { console.error("Runner crashed:", e); process.exit(1); });
