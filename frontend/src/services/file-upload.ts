import { v4 as uuidv4 } from "uuid";
import { apiClient, API_ENDPOINTS } from "../config/api";
import type { AxiosProgressEvent } from "axios";

import { API_BASE_URL } from "@/config/api";

interface UploadResponse {
  success: boolean;
  message?: string;
  url?: string;
  previewUrl?: string;
  originalName?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

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

// Simple test upload without compression
export const uploadFileDirect = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiClient.post<UploadResponse>(
      API_ENDPOINTS.UPLOAD,
      formData
    );

    return response.data;
  } catch (error) {
    console.error("Direct upload error:", error);
    throw error;
  }
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
    const response = await apiClient.post<UploadResponse>(
      API_ENDPOINTS.UPLOAD,
      formData,
      {
        onUploadProgress: options.onUploadProgress,
        signal: options.signal,
        params: {
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      }
    );

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
    console.error("Upload Error:", error);

    // Type guard for axios error
    if (error && typeof error === "object" && "response" in error) {
      console.error("Error response:", (error as any).response?.data);
    }

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
        message: error.message || "Upload failed",
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
  const baseUrl = API_BASE_URL.replace("/api", "");
  return `${baseUrl}/uploads/${filename}`;
};
