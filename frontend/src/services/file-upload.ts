import axios, { AxiosProgressEvent } from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://nyambikav2.vms.rw/api";

interface UploadResponse {
  success: boolean;
  message?: string;
  url?: string;
  previewUrl?: string;
  originalName?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Function to get the auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("auth_token")
    );
  }
  return null;
};

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Set Content-Type only for non-FormData requests
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    } else if ("set" in config.headers) {
      // Remove Content-Type for FormData to let the browser set it with the correct boundary
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface UploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  signal?: AbortSignal;
  renameFile?: boolean;
  preview?: boolean;
}

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

// Helper function to generate preview URL
const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

export const uploadFile = async (
  file: File,
  options: UploadOptions = { renameFile: true, preview: true }
): Promise<UploadResponse> => {
  const formData = new FormData();

  // Generate new filename with UUID if renameFile is true
  let fileName = file.name;
  if (options.renameFile) {
    const ext = getFileExtension(file.name);
    fileName = `${uuidv4()}.${ext}`;
  }

  // Create preview URL if preview is enabled
  const previewUrl = options.preview ? createPreviewUrl(file) : undefined;

  // Create a new File object with the new name if renamed
  const fileToUpload = options.renameFile
    ? new File([file], fileName, { type: file.type })
    : file;

  formData.append("image", fileToUpload);

  try {
    const response = await api.post<UploadResponse>("/upload", formData, {
      onUploadProgress: options.onUploadProgress,
      signal: options.signal,
      params: {
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    // Ensure the response URL is a full URL
    const responseData = response.data;
    if (responseData.url && !responseData.url.startsWith("http")) {
      responseData.url = `${API_BASE_URL.replace("/api", "")}${
        responseData.url
      }`;
    }

    // Add preview URL to response
    if (previewUrl) {
      responseData.previewUrl = previewUrl;
    }

    return {
      ...responseData,
      originalName: file.name,
      fileName: fileToUpload.name,
      fileSize: file.size,
      fileType: file.type,
    };
  } catch (error) {
    // Clean up preview URL on error
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    throw error;
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  options: UploadOptions = { renameFile: true, preview: true }
): Promise<UploadResponse[]> => {
  const uploadPromises = files.map((file) =>
    uploadFile(file, options)
      .then((response) => response)
      .catch((error) => ({
        success: false,
        error: error.message || "Upload failed",
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }))
  );

  return Promise.all(uploadPromises);
};

// Utility function to revoke preview URLs when no longer needed
export const revokePreviewUrl = (url: string): void => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

// Helper function to get the full URL for an uploaded file
export const getFileUrl = (filename: string): string => {
  // Use the base domain without /api for direct file access
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}/uploads/${filename}`;
};
