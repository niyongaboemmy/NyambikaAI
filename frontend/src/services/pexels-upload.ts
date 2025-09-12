const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const PEXELS_API_URL = "https://api.pexels.com/v1";

interface UploadResponse {
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

export const uploadPhoto = async (file: File, title: string): Promise<UploadResponse> => {
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  try {
    const response = await fetch(`${PEXELS_API_URL}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload photo');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading photo to Pexels:', error);
    throw error;
  }
};
