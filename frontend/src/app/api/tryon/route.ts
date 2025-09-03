// frontend/src/app/api/tryon/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const personImage = formData.get("person_image");
    const garmentImage = formData.get("garment_image");

    if (!personImage || !garmentImage) {
      return NextResponse.json(
        { error: "Both person_image and garment_image are required" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_TRYON_API || "http://127.0.0.1:8000/try-on";
    const kolorsResponse = await fetch(backendUrl, {
      method: "POST",
      body: formData,
    });

    if (!kolorsResponse.ok) {
      const error = await kolorsResponse.text();
      console.error("Kolors service error:", error);
      return NextResponse.json(
        { error: "Failed to process images with Kolors service" },
        { status: kolorsResponse.status }
      );
    }

    const imageBuffer = await kolorsResponse.arrayBuffer();
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Error in try-on API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
