/**
 * Nyambika API — Comprehensive Endpoint Test Runner
 * Run with: npx ts-node test-all-endpoints.ts
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
import { Pool } from "pg";

const BASE = process.env.BASE_URL || "";
let pass = 0, fail = 0, skip = 0;

interface Result { label: string; status: "PASS" | "FAIL" | "SKIP"; detail: string }
const results: Result[] = [];

function log(r: Result) {
  const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "⊘";
  const color = r.status === "PASS" ? "\x1b[32m" : r.status === "FAIL" ? "\x1b[31m" : "\x1b[33m";
  console.log(`  ${color}${icon}\x1b[0m ${r.label}  ${r.detail}`);
  results.push(r);
  if (r.status === "PASS") pass++;
  else if (r.status === "FAIL") fail++;
  else skip++;
}

async function chk(label: string, method: string, path: string, expected: number, options: RequestInit = {}): Promise<any> {
  try {
    const resp = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: options.body,
    });
    const body = await resp.text();
    let json: any = null;
    try { json = JSON.parse(body); } catch {}
    if (resp.status === expected) {
      log({ label, status: "PASS", detail: `→ ${resp.status}` });
    } else {
      log({ label, status: "FAIL", detail: `→ expected ${expected} got ${resp.status} | ${body.substring(0, 150)}` });
    }
    return json;
  } catch (e: any) {
    log({ label, status: "FAIL", detail: `→ REQUEST ERROR: ${e.message}` });
    return null;
  }
}

function section(name: string) {
  console.log(`\n\x1b[1m\x1b[34m══ ${name} ══\x1b[0m`);
}

async function main() {
  console.log("\x1b[1m🧪 Nyambika API Test Suite\x1b[0m");
  console.log(`   Base: ${BASE}\n`);

  // ── 1. Health ────────────────────────────────────────
  section("1 · Health");
  await chk("GET /health", "GET", "/health", 200);
  await chk("GET /",       "GET", "/",       200);

  // ── 2. Auth ──────────────────────────────────────────
  section("2 · Auth");
  const ts = Date.now();
  const email = `tester${ts}@nyambika.test`;

  await chk("POST /api/auth/register", "POST", "/api/auth/register", 201, {
    body: JSON.stringify({ username: `u${ts}`, email, password: "Test1234!", name: "Tester", role: "customer" }),
  });

  const loginData = await chk("POST /api/auth/login", "POST", "/api/auth/login", 200, {
    body: JSON.stringify({ email, password: "Test1234!" }),
  });
  const TOKEN: string = loginData?.token || "";
  if (TOKEN) log({ label: "Token extracted", status: "PASS", detail: `→ ${TOKEN.substring(0, 30)}…` });
  else       log({ label: "Token extracted", status: "FAIL", detail: "→ no token in login response" });

  await chk("GET /api/auth/me (authed)",   "GET", "/api/auth/me", 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
  await chk("GET /api/auth/me (unauthed)", "GET", "/api/auth/me", 401);

  // ── 3. Catalogue ─────────────────────────────────────
  section("3 · Catalogue");
  await chk("GET /api/categories",         "GET", "/api/categories",          200);
  await chk("GET /api/products",           "GET", "/api/products",             200);
  await chk("GET /api/products?limit=3",   "GET", "/api/products?limit=3",     200);
  await chk("GET /api/products/bad-id",    "GET", "/api/products/00000000-0000-0000-0000-000000000000", 404);
  await chk("GET /api/producers",          "GET", "/api/producers",            200);
  await chk("GET /api/companies",          "GET", "/api/companies",            200);
  await chk("GET /api/search?q=shirt",     "GET", "/api/search?q=shirt",       200);
  await chk("GET /api/subscription-plans", "GET", "/api/subscription-plans",   200);
  await chk("GET /api/terms",              "GET", "/api/terms",                200);

  // ── 4. Try-On (public) ───────────────────────────────
  section("4 · Try-On Sessions (public)");
  await chk("GET /api/try-on/sessions",  "GET", "/api/try-on/sessions",  200);
  // Note: /api/try-on-sessions is now mounted with a GET / handler — expect 200
  await chk("GET /api/try-on-sessions (alias)", "GET", "/api/try-on-sessions", 200);

  // Get a real session ID from DB
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows: sessionRows } = await pool.query<{ id: string }>(
    "SELECT id FROM try_on_sessions WHERE is_hidden = false LIMIT 1"
  );
  const { rows: productRows } = await pool.query<{ id: string }>(
    "SELECT id FROM products LIMIT 1"
  );
  await pool.end();

  const DB_SID  = sessionRows[0]?.id  || "";
  const PROD_ID = productRows[0]?.id  || "";

  if (DB_SID) {
    await chk("GET /api/try-on/sessions/:id",      "GET", `/api/try-on/sessions/${DB_SID}`,           200);
    await chk("GET /api/try-on/:id (alias)",        "GET", `/api/try-on/${DB_SID}`,                   200);
    await chk("GET /:id/comments",                  "GET", `/api/try-on-sessions/${DB_SID}/comments`, 200);
    await chk("POST /:id/view",                     "POST",`/api/try-on-sessions/${DB_SID}/view`,     200);
  } else {
    log({ label: "Per-session reads (4 checks)", status: "SKIP", detail: "No visible sessions in DB" });
    skip += 3;
  }

  // ── 5. Try-On (authed writes) ────────────────────────
  section("5 · Try-On Sessions (authed writes)");
  let SID = "";

  if (!TOKEN || !PROD_ID) {
    log({ label: "Try-on writes (10 checks)", status: "SKIP", detail: !TOKEN ? "No token" : "No products" });
    skip += 9;
  } else {
    const created = await chk("POST /api/try-on/sessions (create)", "POST", "/api/try-on/sessions", 201, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ productId: PROD_ID, productName: "Test Shirt", customerImageUrl: "data:image/png;base64,abc" }),
    });
    SID = created?.session?.id || "";
    if (SID) log({ label: "Session ID extracted", status: "PASS", detail: `→ ${SID}` });
    else      log({ label: "Session ID extracted", status: "FAIL", detail: "→ not found in response" });
  }

  if (SID && TOKEN) {
    await chk("PUT /api/try-on/sessions/:id", "PUT", `/api/try-on/sessions/${SID}`, 200, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ notes: "test note", rating: 4 }),
    });
    await chk("POST /:id/like",   "POST",   `/api/try-on-sessions/${SID}/like`, 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
    await chk("DELETE /:id/like", "DELETE", `/api/try-on-sessions/${SID}/like`, 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
    await chk("POST /:id/save",   "POST",   `/api/try-on-sessions/${SID}/save`, 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
    await chk("DELETE /:id/save", "DELETE", `/api/try-on-sessions/${SID}/save`, 200, { headers: { Authorization: `Bearer ${TOKEN}` } });

    const cmtData = await chk("POST /:id/comments", "POST", `/api/try-on-sessions/${SID}/comments`, 201, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ text: "Looks great!" }),
    });
    const CID = cmtData?.comment?.id || "";

    await chk("GET /:id/comments", "GET", `/api/try-on-sessions/${SID}/comments`, 200);
    if (CID) {
      await chk("DELETE /:id/comments/:cid", "DELETE", `/api/try-on-sessions/${SID}/comments/${CID}`, 200, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
    }
    await chk("DELETE /api/try-on/sessions/:id (hide)", "DELETE", `/api/try-on/sessions/${SID}`, 200, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  }

  // ── 6. Cart ──────────────────────────────────────────
  section("6 · Cart");
  if (!TOKEN) {
    log({ label: "Cart (4 checks)", status: "SKIP", detail: "No token" });
    skip += 3;
  } else {
    await chk("GET /api/cart", "GET", "/api/cart", 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (PROD_ID) {
      const cartData = await chk("POST /api/cart", "POST", "/api/cart", 201, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ productId: PROD_ID, quantity: 1 }),
      });
      const CART_ID = cartData?.id || "";
      if (CART_ID) {
        await chk("PUT /api/cart/:id", "PUT", `/api/cart/${CART_ID}`, 200, {
          headers: { Authorization: `Bearer ${TOKEN}` },
          body: JSON.stringify({ quantity: 2 }),
        });
        await chk("DELETE /api/cart/:id", "DELETE", `/api/cart/${CART_ID}`, 204, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
      }
    }
  }

  // ── 7. Favorites ─────────────────────────────────────
  section("7 · Favorites");
  if (TOKEN) await chk("GET /api/favorites", "GET", "/api/favorites", 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
  else log({ label: "GET /api/favorites", status: "SKIP", detail: "No token" });

  // ── 8. Orders ────────────────────────────────────────
  section("8 · Orders");
  if (TOKEN) await chk("GET /api/orders", "GET", "/api/orders", 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
  else log({ label: "GET /api/orders", status: "SKIP", detail: "No token" });

  // ── 9. Newsletter ────────────────────────────────────
  section("9 · Newsletter");
  await chk("POST /api/newsletter/subscribe", "POST", "/api/newsletter/subscribe", 200, {
    body: JSON.stringify({ email: `nl${ts}@test.com` }),
  });

  // ── 10. Wallet ───────────────────────────────────────
  section("10 · Wallet");
  if (TOKEN) {
    await chk("GET /api/wallet",          "GET", "/api/wallet",          200, { headers: { Authorization: `Bearer ${TOKEN}` } });
    await chk("GET /api/wallet/payments", "GET", "/api/wallet/payments", 200, { headers: { Authorization: `Bearer ${TOKEN}` } });
  } else {
    log({ label: "Wallet (2 checks)", status: "SKIP", detail: "No token" });
    skip++;
  }

  // ── 11. Profile ──────────────────────────────────────
  section("11 · Profile");
  if (TOKEN) {
    await chk("PUT /api/auth/profile", "PUT", "/api/auth/profile", 200, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ fullName: "Updated Tester" }),
    });
  }

  // ── 12. Negative cases ───────────────────────────────
  section("12 · Negative cases");
  await chk("Wrong password login (expect 401)",    "POST", "/api/auth/login",      401, { body: JSON.stringify({ email: "x@x.com", password: "bad" }) });
  await chk("Unauthed session create (expect 401)", "POST", "/api/try-on/sessions", 401, { body: JSON.stringify({ x: "y" }) });

  // ── Summary ──────────────────────────────────────────
  const total = pass + fail + skip;
  console.log(`\n\x1b[1m${"═".repeat(50)}\x1b[0m`);
  console.log(`  Total: ${total}  |  \x1b[32mPASS: ${pass}\x1b[0m  |  \x1b[31mFAIL: ${fail}\x1b[0m  |  \x1b[33mSKIP: ${skip}\x1b[0m`);
  console.log(`\x1b[1m${"═".repeat(50)}\x1b[0m\n`);

  if (fail > 0) {
    console.log("\x1b[31mFailed tests:\x1b[0m");
    results.filter(r => r.status === "FAIL").forEach(r => console.log(`  ✗ ${r.label}: ${r.detail}`));
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
