import React, { useState } from "react";
import {
  ImageIcon,
  ImagePlus,
  Search,
  Camera,
  Sparkles,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { Label } from "@/components/custom-ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { PexelsImageModal } from "@/components/PexelsImageModal";
import { ProductFormData } from "../ProductForm";

interface ImagesSubmitStepProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  touchedFields: Set<string>;
  onInputChange: (field: keyof ProductFormData, value: any) => void;
  getFieldError: (field: keyof ProductFormData) => string;
  removeArrayItem: (field: keyof ProductFormData, index: number) => void;
  onSubmit: (data: ProductFormData) => Promise<void> | void;
  submitLabel: string;
  loading?: boolean;
}

export function ImagesSubmitStep({
  formData,
  errors,
  touchedFields,
  onInputChange,
  getFieldError,
  removeArrayItem,
  onSubmit,
  submitLabel,
  loading = false,
}: ImagesSubmitStepProps) {
  const [showPexelsModal, setShowPexelsModal] = useState(false);
  const [pexelsModalType, setPexelsModalType] = useState<"main" | "additional">(
    "main"
  );
  const [submitting, setSubmitting] = useState(false);

  const addImageUrl = (url: string) => {
    if (url.trim() && !formData.additionalImages.includes(url.trim())) {
      onInputChange("additionalImages", [
        ...formData.additionalImages,
        url.trim(),
      ]);
    }
  };

  const handlePexelsImageSelect = (imageUrl: string) => {
    if (pexelsModalType === "main") {
      onInputChange("imageUrl", imageUrl);
    } else {
      addImageUrl(imageUrl);
    }
    setShowPexelsModal(false);
  };

  const openPexelsModal = (type: "main" | "additional") => {
    setPexelsModalType(type);
    setShowPexelsModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Product Images */}
      <Card className="glassmorphism border-0 shadow-xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-b border-white/20 dark:border-gray-700/50 py-3">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-3 text-gray-800 dark:text-gray-100">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <ImageIcon className="h-5 w-5" />
            </div>
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Main Image Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Main Product Image *
              </label>
              {getFieldError("imageUrl") && (
                <span className="text-xs text-red-500 dark:text-red-400">
                  {getFieldError("imageUrl")}
                </span>
              )}
            </div>

            {/* Main Image Display/Selector */}
            {formData.imageUrl ? (
              <div className="flex justify-center">
                <div className="relative group w-full max-w-xs sm:max-w-sm">
                  <div className="glassmorphism rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] bg-white/50 dark:bg-gray-800/50">
                    <img
                      src={formData.imageUrl}
                      alt="Main product"
                      className="w-full h-64 sm:h-80 object-cover rounded-xl mx-auto shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute top-6 left-6 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full font-medium shadow-lg">
                      Main Image
                    </div>
                    <div className="absolute inset-4 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex items-center justify-center">
                      <Button
                        type="button"
                        onClick={() => openPexelsModal("main")}
                        className="bg-white/95 hover:bg-white text-gray-900 font-medium shadow-xl transition-all duration-200 hover:scale-105"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Change Image
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => openPexelsModal("main")}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 group-hover:from-indigo-200 group-hover:to-purple-200 dark:group-hover:from-indigo-800/50 dark:group-hover:to-purple-800/50 transition-all duration-300">
                    <ImagePlus className="h-8 w-8 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Add Main Product Image
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      Browse high-quality images from Pexels
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Browse Images
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base sm:text-sm font-medium">
                Additional Product Images
              </Label>
              <Button
                type="button"
                onClick={() => openPexelsModal("additional")}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-all duration-200 hover:scale-105"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>
            {/* Additional Images Gallery */}
            {formData.additionalImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Additional Images ({formData.additionalImages.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {formData.additionalImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="glassmorphism rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] bg-white/50 dark:bg-gray-800/50">
                        <div className="relative">
                          <img
                            src={url}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-40 sm:h-48 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                            onClick={() =>
                              removeArrayItem("additionalImages", index)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full font-medium shadow-lg">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for Additional Images */}
            {formData.additionalImages.length === 0 && (
              <div className="text-center py-6 sm:py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No additional images added yet
                </p>
                <Button
                  type="button"
                  onClick={() => openPexelsModal("additional")}
                  variant="outline"
                  size="sm"
                  className="transition-all duration-200 hover:scale-105"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Your First Image
                </Button>
              </div>
            )}
          </div>

          {/* Submit Section removed in favor of footer bar submission */}
        </CardContent>
      </Card>

      {/* Pexels Image Modal */}
      <PexelsImageModal
        isOpen={showPexelsModal}
        onClose={() => setShowPexelsModal(false)}
        onSelect={handlePexelsImageSelect}
        fixedSize="large"
        searchValue={
          pexelsModalType === "main"
            ? formData.name || "fashion clothing"
            : "fashion accessories"
        }
      />
    </div>
  );
}
