"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { cn } from "@/lib/utils";
import { compressImageFile } from "@/utils/imageCompression";

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onImagesChange,
  maxImages = 2,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  className,
  disabled = false,
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return;

    const validFiles: File[] = [];
    const compressedFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of Array.from(files)) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported`);
        continue;
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File size must be less than ${maxSizeMB}MB`);
        continue;
      }

      // Check max images limit
      if (selectedFiles.length + validFiles.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        break;
      }

      validFiles.push(file);

      // Compress each file to <= 700 KB, output JPEG for good size/compatibility
      try {
        const compressed = (await compressImageFile(file, {
          maxSizeKB: 100,
          mimeType: "image/jpeg",
          maxWidth: 2000,
          maxHeight: 2000,
          returnType: "file",
          outputFilename: `${file.name.replace(/\.[^.]+$/, "")}-compressed.jpg`,
        })) as File;
        compressedFiles.push(compressed);

        // Create preview from compressed file
        const previewUrl = URL.createObjectURL(compressed);
        newPreviews.push(previewUrl);
      } catch (err) {
        console.error("Failed to compress image:", err);
      }
    }

    if (compressedFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...compressedFiles];
      setSelectedFiles(updatedFiles);
      setPreviews((prev) => [...prev, ...newPreviews]);
      onImagesChange(updatedFiles);
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);

    setSelectedFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onImagesChange(updatedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed",
          selectedFiles.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={async (e) => {
            await handleFiles(e.target.files);
          }}
          className="hidden"
          disabled={disabled || selectedFiles.length >= maxImages}
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {selectedFiles.length >= maxImages
              ? `Maximum ${maxImages} images selected`
              : "Upload size evidence photos"}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedFiles.length >= maxImages
              ? "Remove an image to upload more"
              : `Drag and drop up to ${maxImages} images, or click to browse`}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Supports:{" "}
            {acceptedTypes.map((type) => type.split("/")[1]).join(", ")} • Max{" "}
            {maxSizeMB}MB each
          </p>
        </div>
      </div>

      {/* Preview Images */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {selectedFiles[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Status */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center">
            <ImageIcon className="h-4 w-4 mr-1" />
            {selectedFiles.length} of {maxImages} images selected
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFiles([]);
              setPreviews([]);
              onImagesChange([]);
            }}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
