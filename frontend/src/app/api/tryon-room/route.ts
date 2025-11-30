// frontend/src/app/api/tryon-room/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product-id");
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sortBy = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") || "desc";

    // Call the actual backend API
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003";

    // Build query parameters for backend
    const backendParams = new URLSearchParams({
      limit: limit.toString(),
      offset: ((page - 1) * limit).toString(),
    });

    // Add status filter if we want only completed sessions
    backendParams.append("status", "completed");

    const response = await fetch(
      `${backendUrl}/api/try-on/sessions?${backendParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    console.log(
      "Backend API call:",
      `${backendUrl}/api/try-on/sessions?${backendParams.toString()}`
    );
    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Backend API error:",
        response.status,
        response.statusText,
        errorText
      );
      throw new Error(
        `Failed to fetch try-on sessions from backend: ${response.status} ${response.statusText}`
      );
    }

    const backendData = await response.json();
    console.log("Backend response data:", backendData);

    let sessions = backendData.data || [];

    // Filter by product ID if specified
    if (productId) {
      sessions = sessions.filter(
        (session: any) => session.productId === productId
      );
    }

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sessions = sessions.filter((session: any) => {
        // Note: Backend doesn't include product name, so we'll search by status and other available fields
        return (
          session.status?.toLowerCase().includes(query) ||
          session.id?.toLowerCase().includes(query)
        );
      });
    }

    // Sort sessions (frontend sorting since backend might not support all sort options)
    sessions.sort((a: any, b: any) => {
      let aValue: any = a[sortBy as keyof typeof a] || "";
      let bValue: any = b[sortBy as keyof typeof b] || "";

      if (sortBy === "createdAt") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Pagination (frontend pagination since backend uses offset/limit)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    // Transform sessions to match frontend expected format
    const transformedSessions = paginatedSessions.map((session: any) => ({
      id: session.id,
      productId: session.productId,
      productName: "Product", // Backend doesn't include product name, would need separate query
      productImage: "/images/placeholder-product.jpg", // Backend doesn't include product image
      customerImage: session.customerImageUrl,
      resultImage: session.resultImageUrl || session.customerImageUrl, // Fallback to customer image
      status: session.status,
      createdAt: session.createdAt,
      userId: session.userId,
      userName: "User", // Backend doesn't include user name, would need separate query
      userAvatar: "https://picsum.photos/seed/avatar/100/100.jpg", // Placeholder avatar
      likes: Math.floor(Math.random() * 50), // Mock likes since backend doesn't track this
      views: Math.floor(Math.random() * 200), // Mock views since backend doesn't track this
    }));

    return NextResponse.json({
      success: true,
      data: transformedSessions,
      pagination: {
        page,
        limit,
        total: sessions.length,
        totalPages: Math.ceil(sessions.length / limit),
        hasNextPage: endIndex < sessions.length,
        hasPreviousPage: page > 1,
      },
      filters: {
        productId,
        searchQuery,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Error fetching try-on room sessions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch try-on sessions",
      },
      { status: 500 }
    );
  }
}
