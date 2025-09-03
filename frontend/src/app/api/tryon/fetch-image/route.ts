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

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Upstream fetch failed`, status: res.status, details: text?.slice(0, 500) },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Fetch proxy error", details: String(e) },
      { status: 500 }
    );
  }
}
