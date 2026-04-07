const PROXY_URL = "/api/pexels/search";

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
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(`${PROXY_URL}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch images from Pexels");
  }

  return response.json();
};

export const getPopularImages = async (
  page: number = 1,
  perPage: number = 12
): Promise<PexelsSearchResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(`${PROXY_URL}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch popular images from Pexels");
  }

  return response.json();
};
