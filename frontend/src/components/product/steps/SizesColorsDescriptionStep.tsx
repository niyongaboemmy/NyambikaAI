import React, { useRef, useState } from "react";
import {
  Palette,
  Ruler,
  FileText,
  Plus,
  X,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { FormTextarea } from "@/components/custom-ui/form-textarea";
import { FormInput } from "@/components/custom-ui/form-input";
import { Label } from "@/components/custom-ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { ProductFormData } from "../ProductForm";

interface SizesColorsDescriptionStepProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  touchedFields: Set<string>;
  onInputChange: (field: keyof ProductFormData, value: any) => void;
  getFieldError: (field: keyof ProductFormData) => string;
  addArrayItem: (field: keyof ProductFormData, item: string) => void;
  removeArrayItem: (field: keyof ProductFormData, index: number) => void;
}

const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const commonColors = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Black",
  "White",
  "Gray",
  "Brown",
  "Pink",
  "Purple",
  "Orange",
  "Navy",
  "Maroon",
  "Beige",
  "Cream",
];

export function SizesColorsDescriptionStep({
  formData,
  errors,
  touchedFields,
  onInputChange,
  getFieldError,
  addArrayItem,
  removeArrayItem,
}: SizesColorsDescriptionStepProps) {
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const sizeInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  // AI-powered description generation
  const generateDescription = async () => {
    if (!formData.name.trim()) {
      return;
    }

    setGeneratingDescription(true);
    try {
      // Simulate AI generation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const aiDescription = `Discover the elegance of ${formData.name}, a premium fashion piece that combines traditional craftsmanship with modern style. This carefully designed product offers exceptional quality and comfort, perfect for those who appreciate authentic fashion. Made with attention to detail and using high-quality materials, this item is ideal for both casual and formal occasions. Experience the perfect blend of style, comfort, and durability.`;

      const aiDescriptionRw = `Menya ubwiza bwa ${formData.name}, igikoresho cy'imyambaro y'igihe kizaza gihuriza ubuhanga gakondo n'uburyo bugezweho. Iki gicuruzwa cyateguwe n'ubwenge gitanga ubuziranenge n'ibyishimo bidasanzwe, bikwiye abo baha imyambaro y'ukuri. Cyakozwe mu kwita ku buryo bwose no gukoresha ibikoresho by'ubwiza, iki gicuruzwa ni cyo kuri ibihe byose. Menya guhuza neza ubwiza, ibyishimo, n'igihe kirekire.`;

      onInputChange("description", aiDescription);
      onInputChange("descriptionRw", aiDescriptionRw);
    } catch (error) {
      console.error("Failed to generate description");
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sizes & Colors - Progressive Disclosure */}
      <Card className="glassmorphism border-0 shadow-xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-b border-white/20 dark:border-gray-700/50 py-3">
          <CardTitle className="text-lg sm:text-xl flex items-center justify-between text-gray-800 dark:text-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <Palette className="h-5 w-5" />
              </div>
              Sizes & Colors
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showAdvancedOptions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAdvancedOptions && (
          <CardContent className="p-3 sm:p-4 space-y-4 sm:space-y-6">
            {/* Sizes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-purple-500" />
                <Label className="text-base font-medium">Available Sizes</Label>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {commonSizes.map((size) => {
                  const selected = formData.sizes.includes(size);
                  return (
                    <Button
                      key={size}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className={`h-10 sm:h-12 text-sm sm:text-base transition-all duration-200 ${
                        selected
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                          : "hover:scale-105 hover:shadow-md"
                      }`}
                      onClick={() => {
                        if (selected) {
                          removeArrayItem(
                            "sizes",
                            formData.sizes.indexOf(size)
                          );
                        } else {
                          addArrayItem("sizes", size);
                        }
                      }}
                    >
                      {size}
                    </Button>
                  );
                })}
              </div>
              <div className="flex gap-2 sm:gap-2.5">
                <FormInput
                  placeholder="Add custom size (e.g., 38, One Size)"
                  ref={sizeInputRef}
                  className="flex-1 text-sm sm:text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget as HTMLInputElement;
                      addArrayItem("sizes", input.value);
                      input.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-2.5 sm:px-3 h-9 sm:h-11"
                  onClick={() => {
                    const val = sizeInputRef.current?.value || "";
                    addArrayItem("sizes", val);
                    if (sizeInputRef.current) sizeInputRef.current.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((s, idx) => (
                    <div
                      key={`${s}-${idx}`}
                      className="px-2 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-700 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        {s}
                      </span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => removeArrayItem("sizes", idx)}
                        aria-label={`Remove size ${s}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-medium">Available Colors</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {commonColors.map((color) => {
                  const selected = formData.colors.includes(color);
                  return (
                    <Button
                      key={color}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className={`h-10 sm:h-12 text-sm sm:text-base transition-all duration-200 ${
                        selected
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                          : "hover:scale-105 hover:shadow-md"
                      }`}
                      onClick={() => {
                        if (selected) {
                          removeArrayItem(
                            "colors",
                            formData.colors.indexOf(color)
                          );
                        } else {
                          addArrayItem("colors", color);
                        }
                      }}
                    >
                      {color}
                    </Button>
                  );
                })}
              </div>
              <div className="flex gap-2 sm:gap-3">
                <FormInput
                  placeholder="Add custom color (e.g., Cyan, Olive)"
                  ref={colorInputRef}
                  className="flex-1 text-base sm:text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget as HTMLInputElement;
                      addArrayItem("colors", input.value);
                      input.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3 sm:px-4 h-10 sm:h-12"
                  onClick={() => {
                    const val = colorInputRef.current?.value || "";
                    addArrayItem("colors", val);
                    if (colorInputRef.current) colorInputRef.current.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((c, idx) => (
                    <div
                      key={`${c}-${idx}`}
                      className="px-3 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                    >
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {c}
                      </span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => removeArrayItem("colors", idx)}
                        aria-label={`Remove color ${c}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI-Powered Description */}
      <Card className="glassmorphism border-0 shadow-xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-blue-500/5 border-b border-white/20 dark:border-gray-700/50 py-3">
          <CardTitle className="text-lg sm:text-xl flex items-center justify-between text-gray-800 dark:text-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <FileText className="h-5 w-5" />
              </div>
              Product Description
            </div>
            <Button
              type="button"
              onClick={generateDescription}
              disabled={generatingDescription || !formData.name.trim()}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              {generatingDescription ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Generate
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="space-y-4">
            <FormTextarea
              id="description"
              label="Description (English) *"
              value={formData.description}
              onChange={(e) =>
                onInputChange(
                  "description",
                  (e.target as HTMLTextAreaElement).value
                )
              }
              placeholder="Describe your product in detail... or use AI to generate"
              className="min-h-[120px] sm:min-h-[140px] text-base sm:text-sm resize-none"
              error={getFieldError("description")}
            />
            <FormTextarea
              id="descriptionRw"
              label="Ibisobanuro mu Kinyarwanda"
              value={formData.descriptionRw}
              onChange={(e) =>
                onInputChange(
                  "descriptionRw",
                  (e.target as HTMLTextAreaElement).value
                )
              }
              placeholder="Sobanura igicuruzwa cyawe mu buryo burambuye... cyangwa koresha AI"
              className="min-h-[120px] sm:min-h-[140px] text-base sm:text-sm resize-none"
            />
          </div>
          {!formData.name.trim() && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Wand2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Enter a product name first to use AI description generation
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
