import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  Image as ImageIcon,
  Plus,
  Save,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormInput } from "@/components/ui/form-input";
import FormReactSelect from "@/components/ui/form-react-select";
import { FormTextarea } from "@/components/ui/form-textarea";

export type ProductFormData = {
  name: string;
  nameRw: string;
  description: string;
  descriptionRw: string;
  price: string; // keep as string in form
  categoryId: string;
  imageUrl: string;
  additionalImages: string[];
  sizes: string[];
  colors: string[];
  stockQuantity: number;
  material: string;
  materialRw: string;
  careInstructions: string;
  careInstructionsRw: string;
  tags: string[];
  isCustomizable: boolean;
  customizationOptions: string[];
};

export type CategoryOption = { id: string; name: string };

export type ProductFormProps = {
  title: string;
  submitLabel: string;
  initialValues: ProductFormData;
  categories: CategoryOption[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (data: ProductFormData) => Promise<void> | void;
};

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

export function ProductForm({
  title,
  submitLabel,
  initialValues,
  categories,
  loading = false,
  onCancel,
  onSubmit,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const sizeInputRef = useRef<HTMLInputElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const additionalImageRef = useRef<HTMLInputElement | null>(null);

  const options = useMemo(() => categories || [], [categories]);

  // Keep internal state in sync when parent supplies new initialValues (e.g., after fetch in edit page)
  useEffect(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addArrayItem = (field: keyof ProductFormData, item: string) => {
    if (item.trim()) {
      const currentArray = formData[field] as string[];
      if (!currentArray.includes(item.trim())) {
        handleInputChange(field, [...currentArray, item.trim()]);
      }
    }
  };

  const removeArrayItem = (field: keyof ProductFormData, index: number) => {
    const currentArray = formData[field] as string[];
    handleInputChange(
      field,
      currentArray.filter((_, i) => i !== index)
    );
  };

  const addImageUrl = (url: string) => {
    if (url.trim() && !formData.additionalImages.includes(url.trim())) {
      handleInputChange("additionalImages", [
        ...formData.additionalImages,
        url.trim(),
      ]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.nameRw.trim())
      newErrors.nameRw = "Kinyarwanda name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.imageUrl.trim())
      newErrors.imageUrl = "Main image is required";
    if (formData.stockQuantity < 0)
      newErrors.stockQuantity = "Stock quantity cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 px-2 md:px-0">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-1">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {title.includes("Edit")
            ? "Update your product details"
            : "Add your product to the NyambikaAI marketplace"}
        </p>
      </div>

      {/* Basic Information */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="gradient-text text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              id="name"
              label="Product Name (English) *"
              value={formData.name}
              onChange={(e) =>
                handleInputChange("name", (e.target as HTMLInputElement).value)
              }
              placeholder="e.g., Traditional Rwandan Dress"
              error={errors.name}
            />
            <FormInput
              id="nameRw"
              label="Izina mu Kinyarwanda *"
              value={formData.nameRw}
              onChange={(e) =>
                handleInputChange(
                  "nameRw",
                  (e.target as HTMLInputElement).value
                )
              }
              placeholder="e.g., Ikoti Gakondo"
              error={errors.nameRw}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              id="price"
              label="Price (RWF) *"
              type="number"
              value={formData.price}
              onChange={(e) =>
                handleInputChange("price", (e.target as HTMLInputElement).value)
              }
              placeholder="25000"
              error={errors.price}
            />
            <FormReactSelect
              id="categoryId"
              label="Category *"
              value={formData.categoryId}
              onChange={(val) => handleInputChange("categoryId", val)}
              options={options.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
              className="mt-[-2px]"
              error={errors.categoryId}
            />
          </div>

          <FormInput
            id="stockQuantity"
            label="Stock Quantity"
            type="number"
            value={formData.stockQuantity}
            onChange={(e) =>
              handleInputChange(
                "stockQuantity",
                parseInt((e.target as HTMLInputElement).value) || 0
              )
            }
            placeholder="10"
          />
        </CardContent>
      </Card>

      {/* Sizes & Colors */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="gradient-text text-lg">
            Sizes & Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Sizes */}
          <div className="space-y-3">
            <Label>Available Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {commonSizes.map((size) => {
                const selected = formData.sizes.includes(size);
                return (
                  <Button
                    key={size}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className={selected ? "gradient-bg text-white" : ""}
                    onClick={() => {
                      if (selected) {
                        removeArrayItem("sizes", formData.sizes.indexOf(size));
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
            <div className="flex gap-2">
              <FormInput
                placeholder="Add custom size (e.g., 38, One Size)"
                ref={sizeInputRef}
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
                variant="ghost"
                size="icon"
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
                    className="px-3 py-1 rounded-full glassmorphism flex items-center gap-2"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600"
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
            <Label>Available Colors</Label>
            <div className="flex flex-wrap gap-2">
              {commonColors.map((color) => {
                const selected = formData.colors.includes(color);
                return (
                  <Button
                    key={color}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    className={selected ? "gradient-bg text-white" : ""}
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
            <div className="flex gap-2">
              <FormInput
                placeholder="Add custom color (e.g., Cyan, Olive)"
                ref={colorInputRef}
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
                variant="ghost"
                size="icon"
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
                    className="px-3 py-1 rounded-full glassmorphism flex items-center gap-2"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600"
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
      </Card>

      {/* Description */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="gradient-text text-lg">
            Product Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormTextarea
            id="description"
            label="Description (English) *"
            value={formData.description}
            onChange={(e) =>
              handleInputChange(
                "description",
                (e.target as HTMLTextAreaElement).value
              )
            }
            placeholder="Describe your product in detail..."
            className="min-h-[120px]"
            error={errors.description}
          />
          <FormTextarea
            id="descriptionRw"
            label="Ibisobanuro mu Kinyarwanda"
            value={formData.descriptionRw}
            onChange={(e) =>
              handleInputChange(
                "descriptionRw",
                (e.target as HTMLTextAreaElement).value
              )
            }
            placeholder="Sobanura igicuruzwa cyawe mu buryo burambuye..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormInput
            id="imageUrl"
            label="Main Image URL *"
            value={formData.imageUrl}
            onChange={(e) =>
              handleInputChange(
                "imageUrl",
                (e.target as HTMLInputElement).value
              )
            }
            placeholder="https://example.com/image.jpg"
            error={errors.imageUrl}
          />

          {formData.imageUrl && (
            <div className="glassmorphism rounded-xl p-4">
              <img
                src={formData.imageUrl}
                alt="Main product"
                className="w-32 h-32 object-cover rounded-lg mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div>
            <Label>Additional Images</Label>
            <div className="flex gap-2 mt-2">
              <FormInput
                placeholder="Additional image URL"
                ref={additionalImageRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget as HTMLInputElement;
                    addImageUrl(input.value);
                    input.value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const val = additionalImageRef.current?.value || "";
                  addImageUrl(val);
                  if (additionalImageRef.current)
                    additionalImageRef.current.value = "";
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.additionalImages.length > 0 && (
              <div className="grid grid-cols-12 gap-2 mt-4">
                {formData.additionalImages.map((url, index) => (
                  <div
                    key={index}
                    className="relative glassmorphism rounded-lg p-2 col-span-6 md:col-span-4 lg:col-span-2"
                  >
                    <img
                      src={url}
                      alt={`Additional ${index + 1}`}
                      className="min-w-full max-h-[150px] object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      onClick={() => removeArrayItem("additionalImages", index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="glassmorphism"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || loading}
          className="gradient-bg text-white"
        >
          {submitting || loading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              {submitLabel}...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
