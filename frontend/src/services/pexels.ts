const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const PEXELS_API_URL = "https://api.pexels.com/v1";

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
  prev_page?: string;
}

export const searchImages = async (
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<PexelsSearchResponse> => {
  try {
    const response = await fetch(
      `${PEXELS_API_URL}/search?query=${encodeURIComponent(
        query
      )}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch images from Pexels");
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching Pexels images:", error);
    throw error;
  }
};

export const getPopularImages = async (
  page: number = 1,
  perPage: number = 12
): Promise<PexelsSearchResponse> => {
  try {
    const response = await fetch(
      `${PEXELS_API_URL}/curated?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch popular images from Pexels");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching popular Pexels images:", error);
    throw error;
  }
};
