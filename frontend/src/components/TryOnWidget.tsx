// frontend/src/components/TryOnWidget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TryOnWidgetProps {
  onResult?: (result: string) => void;
  onClose?: () => void;
  onNavigateToProduct?: () => void;
}

export function TryOnWidget({
  onResult,
  onClose,
  onNavigateToProduct,
}: TryOnWidgetProps) {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDropPerson = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => setPersonImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onDropGarment = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => setGarmentImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const personDropzone = useDropzone({
    onDrop: onDropPerson,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    maxFiles: 1,
  });

  const garmentDropzone = useDropzone({
    onDrop: onDropGarment,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    maxFiles: 1,
  });

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      setError("Please upload both a person and a garment image");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      const personBlob = await fetch(personImage).then((r) => r.blob());
      const garmentBlob = await fetch(garmentImage).then((r) => r.blob());

      formData.append("person_image", personBlob, "person.jpg");
      formData.append("garment_image", garmentBlob, "garment.jpg");

      const response = await fetch("http://127.0.0.1:8001/try-on", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to process images");
      }

      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);
      setResultImage(resultUrl);

      if (onResult) {
        onResult(resultUrl);
      }

      toast({
        title: "Success",
        description: "Try-on completed successfully!",
      });
    } catch (err) {
      console.error("Error during try-on:", err);
      setError("Failed to process images. Please try again.");
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setGarmentImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Virtual Try-On
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}

          {!resultImage ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Upload Person
                </h3>
                <div
                  {...personDropzone.getRootProps()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <input {...personDropzone.getInputProps()} />
                  {personImage ? (
                    <div className="relative">
                      <img
                        src={personImage}
                        alt="Person"
                        className="max-h-64 mx-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPersonImage(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drag and drop a photo of a person, or click to select
                      </p>
                      <p className="text-xs text-gray-400">
                        Recommended: Full-body shot with clear visibility
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Upload Garment
                </h3>
                <div
                  {...garmentDropzone.getRootProps()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <input {...garmentDropzone.getInputProps()} />
                  {garmentImage ? (
                    <div className="relative">
                      <img
                        src={garmentImage}
                        alt="Garment"
                        className="max-h-64 mx-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGarmentImage(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Drag and drop a photo of the garment, or click to select
                      </p>
                      <p className="text-xs text-gray-400">
                        Recommended: Front view on white background
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={resultImage}
                  alt="Try-on result"
                  className="w-full max-h-[60vh] object-contain mx-auto"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Try Another
                </Button>
                {onNavigateToProduct && (
                  <Button
                    onClick={onNavigateToProduct}
                    className="w-full sm:w-auto"
                  >
                    View Product Details
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = resultImage;
                    link.download = "try-on-result.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Download Result
                </Button>
              </div>
            </div>
          )}

          {!resultImage && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleTryOn}
                disabled={!personImage || !garmentImage || isLoading}
                className="relative"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Try It On"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
