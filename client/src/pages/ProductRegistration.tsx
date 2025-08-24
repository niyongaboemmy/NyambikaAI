import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Package,
  Upload,
  Save,
  X,
  Plus,
  Image as ImageIcon,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

interface ProductFormData {
  name: string;
  nameRw: string;
  description: string;
  descriptionRw: string;
  price: string;
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
}

const initialFormData: ProductFormData = {
  name: "",
  nameRw: "",
  description: "",
  descriptionRw: "",
  price: "",
  categoryId: "",
  imageUrl: "",
  additionalImages: [],
  sizes: [],
  colors: [],
  stockQuantity: 0,
  material: "",
  materialRw: "",
  careInstructions: "",
  careInstructionsRw: "",
  tags: [],
  isCustomizable: false,
  customizationOptions: [],
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

const commonTags = [
  "Traditional",
  "Modern",
  "Casual",
  "Formal",
  "Wedding",
  "Party",
  "Business",
  "Summer",
  "Winter",
  "Handmade",
  "Eco-friendly",
  "Luxury",
];

export default function ProductRegistration() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { open } = useLoginPrompt();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prompt login if unauthenticated; redirect home if not producer/admin
  useEffect(() => {
    if (!isAuthenticated) {
      open();
      return;
    }
    if (user?.role !== "producer" && user?.role !== "admin") {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, user, setLocation, open]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Product creation mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...productData,
          price: parseFloat(productData.price),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: (product) => {
      toast({
        title: "Product created successfully!",
        description: `${product.name} has been submitted for approval.`,
      });
      setLocation("/producer-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.nameRw.trim())
      newErrors.nameRw = "Kinyarwanda name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
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

    setIsSubmitting(true);
    try {
      await createProductMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

  if (
    !isAuthenticated ||
    (user?.role !== "producer" && user?.role !== "admin")
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back to My Products */}
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-3">
              Register New Product
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Add your product to the NyambikaAI marketplace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Product Name (English) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`glassmorphism border-0 bg-transparent mt-2 ${
                        errors.name ? "border-red-500" : ""
                      }`}
                      placeholder="e.g., Traditional Rwandan Dress"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nameRw">Izina mu Kinyarwanda *</Label>
                    <Input
                      id="nameRw"
                      value={formData.nameRw}
                      onChange={(e) =>
                        handleInputChange("nameRw", e.target.value)
                      }
                      className={`glassmorphism border-0 bg-transparent mt-2 ${
                        errors.nameRw ? "border-red-500" : ""
                      }`}
                      placeholder="e.g., Ikoti Gakondo"
                    />
                    {errors.nameRw && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.nameRw}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price">Price (RWF) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      className={`glassmorphism border-0 bg-transparent mt-2 ${
                        errors.price ? "border-red-500" : ""
                      }`}
                      placeholder="25000"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.price}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        handleInputChange("categoryId", value)
                      }
                    >
                      <SelectTrigger
                        className={`glassmorphism border-0 bg-transparent mt-2 ${
                          errors.categoryId ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.categoryId}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      handleInputChange(
                        "stockQuantity",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="glassmorphism border-0 bg-transparent mt-2"
                    placeholder="10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sizes & Colors */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="gradient-text">Sizes & Colors</CardTitle>
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
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom size (e.g., 38, One Size)"
                      className="glassmorphism border-0 bg-transparent"
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
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addArrayItem("sizes", input.value);
                        input.value = "";
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
                    <Input
                      placeholder="Add custom color (e.g., Cyan, Olive)"
                      className="glassmorphism border-0 bg-transparent"
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
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addArrayItem("colors", input.value);
                        input.value = "";
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
                <CardTitle className="gradient-text">
                  Product Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="description">Description (English) *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className={`glassmorphism border-0 bg-transparent mt-2 min-h-[120px] ${
                      errors.description ? "border-red-500" : ""
                    }`}
                    placeholder="Describe your product in detail..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="descriptionRw">
                    Ibisobanuro mu Kinyarwanda
                  </Label>
                  <Textarea
                    id="descriptionRw"
                    value={formData.descriptionRw}
                    onChange={(e) =>
                      handleInputChange("descriptionRw", e.target.value)
                    }
                    className="glassmorphism border-0 bg-transparent mt-2 min-h-[120px]"
                    placeholder="Sobanura igicuruzwa cyawe mu buryo burambuye..."
                  />
                </div>
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
                <div>
                  <Label htmlFor="imageUrl">Main Image URL *</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      handleInputChange("imageUrl", e.target.value)
                    }
                    className={`glassmorphism border-0 bg-transparent mt-2 ${
                      errors.imageUrl ? "border-red-500" : ""
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.imageUrl}
                    </p>
                  )}
                </div>

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
                    <Input
                      placeholder="Additional image URL"
                      className="glassmorphism border-0 bg-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          addImageUrl(input.value);
                          input.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        addImageUrl(input.value);
                        input.value = "";
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
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
                            onClick={() =>
                              removeArrayItem("additionalImages", index)
                            }
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

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/producer-dashboard")}
                className="glassmorphism"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gradient-bg text-white"
              >
                {isSubmitting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
