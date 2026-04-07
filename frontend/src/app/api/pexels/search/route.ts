import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Pexels API key not configured" }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query");
  const page = searchParams.get("page") ?? "1";
  const per_page = searchParams.get("per_page") ?? "12";

  const pexelsUrl = query
    ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`
    : `https://api.pexels.com/v1/curated?page=${page}&per_page=${per_page}`;

  const response = await fetch(pexelsUrl, {
    headers: { Authorization: apiKey },
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
