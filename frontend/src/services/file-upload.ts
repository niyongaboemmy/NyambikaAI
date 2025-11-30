import { v4 as uuidv4 } from "uuid";
import { apiClient, API_ENDPOINTS } from "../config/api";
import type { AxiosProgressEvent } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";

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
  console.log("=== Direct Upload Test ===");
  console.log("File:", file);

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiClient.post<UploadResponse>(
      API_ENDPOINTS.UPLOAD,
      formData
    );

    console.log("Direct upload success:", response.data);
    return response.data;
  } catch (error) {
    console.log("Direct upload error:", error);
    throw error;
  }
};

export const uploadFile = async (
  file: File,
  options: UploadOptions = { renameFile: true, preview: true }
): Promise<UploadResponse> => {
  console.log("=== Frontend Upload Debug ===");
  console.log("Original file:", file);
  console.log("File name:", file.name);
  console.log("File size:", file.size);
  console.log("File type:", file.type);

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

  console.log("File to upload:", fileToUpload);
  formData.append("image", fileToUpload);
  console.log("FormData created, sending request...");

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
    console.log("=== Upload Error ===");
    console.log("Error:", error);

    // Type guard for axios error
    if (error && typeof error === "object" && "response" in error) {
      console.log("Error response:", (error as any).response?.data);
    }
    console.log("===================");

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
  const baseUrl = API_BASE_URL.replace("/api", "");
  return `${baseUrl}/uploads/${filename}`;
};
