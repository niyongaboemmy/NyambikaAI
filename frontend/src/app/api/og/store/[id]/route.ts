import type { NextRequest } from "next/server";

export const runtime = "edge";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nyambika.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || SITE_URL;

async function getCompany(id: string) {
  try {
    const url = new URL(`/api/companies/${id}`, API_BASE_URL).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data as {
      id: string;
      name: string;
      location?: string | null;
      logoUrl?: string | null;
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idRaw = id || "";
  const idDecoded = decodeURIComponent(idRaw.trim());
  const company = await getCompany(idDecoded);

  // Resolve an absolute HTTPS URL for the logo
  const toAbsolute = (u?: string | null) => {
    if (!u) return undefined;
    const t = u.trim();
    if (/^https?:\/\//i.test(t)) return t.replace(/^http:\/\//i, "https://");
    if (t.startsWith("data:")) return undefined; // do not redirect to data URIs
    return new URL(t.startsWith("/") ? t : `/${t}`, SITE_URL).toString();
  };

  const logoUrl = toAbsolute(company?.logoUrl);
  const fallback = new URL("/nyambika_dark_icon.png", SITE_URL).toString();
  const target = logoUrl || fallback;

  // Temporary 302 redirect to the image; LinkedIn will fetch the image itself
  return Response.redirect(target, 302);
}
