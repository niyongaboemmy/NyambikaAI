import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Basic allowlist: only fetch http/https
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // SSRF protection: host allowlist
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const allowlistEnv = process.env.FETCH_IMAGE_HOST_ALLOWLIST || "tryon-api.com,api.tryonapi.com,cdn.tryon-api.com";
    const allowlist = new Set(
      allowlistEnv
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    );

    // Allow subdomains for listed hosts
    const isAllowed = Array.from(allowlist).some((allowed) =>
      host === allowed || host.endsWith(`.${allowed}`)
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Host not allowed", host, allow: Array.from(allowlist) },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Upstream fetch failed`, status: res.status, details: text?.slice(0, 500) },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    // Respect small set of safe caching headers; default to short-lived no-store
    const cacheControl = res.headers.get("cache-control") || "no-store";
    const etag = res.headers.get("etag") || undefined;
    const lastModified = res.headers.get("last-modified") || undefined;

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": cacheControl,
        ...(etag ? { etag } : {}),
        ...(lastModified ? { "last-modified": lastModified } : {}),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Fetch proxy error", details: String(e) },
      { status: 500 }
    );
  }
}

