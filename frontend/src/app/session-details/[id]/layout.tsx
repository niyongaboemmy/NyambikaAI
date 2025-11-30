import { Metadata } from "next";
import { notFound } from "next/navigation";

interface SessionData {
  id: string;
  productName: string;
  userFullName?: string;
  userName?: string;
  tryOnImageUrl: string;
  customerImageUrl: string;
  createdAt: string;
  fitRecommendation?: string;
}

async function getSessionData(sessionId: string): Promise<SessionData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003";
    const response = await fetch(
      `${baseUrl}/api/try-on-sessions/${sessionId}`,
      {
        cache: "no-store", // Ensure fresh data for metadata
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.session || null;
  } catch (error) {
    console.error("Error fetching session data:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const sessionId = resolvedParams.id;

  if (!sessionId) {
    return {
      title: "Session Details - Nyambika",
      description: "View try-on session details",
    };
  }

  const session = await getSessionData(sessionId);

  if (!session) {
    return {
      title: "Session Not Found - Nyambika",
      description: "The requested try-on session could not be found",
    };
  }

  const title = `${session.productName} Try-On by ${
    session.userFullName || session.userName || "User"
  } - Nyambika`;
  const description = session.fitRecommendation
    ? `Check out this amazing AI try-on result for ${session.productName}. ${session.fitRecommendation}`
    : `Discover this stunning virtual try-on of ${session.productName} using AI technology. See how fashion comes to life!`;

  // Use the try-on result image as the primary OG image, fallback to customer image or default
  let imageUrl: string;
  if (session.tryOnImageUrl) {
    imageUrl = session.tryOnImageUrl.startsWith("http")
      ? session.tryOnImageUrl
      : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"}${
          session.tryOnImageUrl
        }`;
  } else if (session.customerImageUrl) {
    imageUrl = session.customerImageUrl.startsWith("http")
      ? session.customerImageUrl
      : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003"}${
          session.customerImageUrl
        }`;
  } else {
    // Fallback to a default image
    imageUrl = "/nyambika_light_icon.png";
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${session.productName} try-on result`,
        },
        // Optionally include the before image as well
        ...(session.customerImageUrl
          ? [
              {
                url: session.customerImageUrl.startsWith("http")
                  ? session.customerImageUrl
                  : `${
                      process.env.NEXT_PUBLIC_API_BASE_URL ||
                      "http://localhost:3003"
                    }${session.customerImageUrl}`,
                alt: `${session.productName} before try-on`,
              },
            ]
          : []),
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function SessionDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
