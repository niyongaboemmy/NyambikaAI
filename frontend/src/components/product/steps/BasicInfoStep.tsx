import React from "react";
import { Package, Zap } from "lucide-react";
import { FormInput } from "@/components/custom-ui/form-input";
import FormReactSelect from "@/components/custom-ui/form-react-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { ProductFormData, CategoryOption } from "../ProductForm";

interface BasicInfoStepProps {
  formData: ProductFormData;
  categories: CategoryOption[];
  errors: Record<string, string>;
  touchedFields: Set<string>;
  onInputChange: (field: keyof ProductFormData, value: any) => void;
  getFieldError: (field: keyof ProductFormData) => string;
}

export function BasicInfoStep({
  formData,
  categories,
  errors,
  touchedFields,
  onInputChange,
  getFieldError,
}: BasicInfoStepProps) {
  const options = categories || [];

  return (
    <div className="space-y-4">

      {/* Basic Information Card */}
      <Card className="glassmorphism border-0 shadow-xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-b border-white/20 dark:border-gray-700/50 py-3">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-3 text-gray-800 dark:text-gray-100">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Package className="h-5 w-5" />
            </div>
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Product Names */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <FormInput
                id="name"
                label="Product Name (English) *"
                value={formData.name}
                onChange={(e) =>
                  onInputChange("name", (e.target as HTMLInputElement).value)
                }
                placeholder="e.g., Traditional Rwandan Dress"
                error={getFieldError('name')}
                className="text-base sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <FormInput
                id="nameRw"
                label="Izina mu Kinyarwanda *"
                value={formData.nameRw}
                onChange={(e) =>
                  onInputChange(
                    "nameRw",
                    (e.target as HTMLInputElement).value
                  )
                }
                placeholder="e.g., Ikoti Gakondo"
                error={getFieldError('nameRw')}
                className="text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Price, Category, Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-1">
              <FormInput
                id="price"
                label="Price (RWF) *"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  onInputChange("price", (e.target as HTMLInputElement).value)
                }
                placeholder="25000"
                error={getFieldError('price')}
                className="text-base sm:text-sm"
              />
            </div>
            <div className="sm:col-span-1">
              <FormReactSelect
                id="categoryId"
                label="Category *"
                value={formData.categoryId}
                onChange={(val) => onInputChange("categoryId", val)}
                options={options.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
                error={getFieldError('categoryId')}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <FormInput
                id="stockQuantity"
                label="Stock Quantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) =>
                  onInputChange(
                    "stockQuantity",
                    parseInt((e.target as HTMLInputElement).value) || 0
                  )
                }
                placeholder="10"
                className="text-base sm:text-sm"
              />
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {[formData.name, formData.nameRw, formData.price, formData.categoryId].filter(Boolean).length}/4 fields completed
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${([formData.name, formData.nameRw, formData.price, formData.categoryId].filter(Boolean).length / 4) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
