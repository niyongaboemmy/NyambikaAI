import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Sparkles,
  Image as ImageIcon,
  Palette,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { SizesColorsDescriptionStep } from "./steps/SizesColorsDescriptionStep";
import { ImagesSubmitStep } from "./steps/ImagesSubmitStep";
import { ProductFormData, CategoryOption } from "./ProductForm";

export interface ProductFormWizardProps {
  title: string;
  submitLabel: string;
  initialValues: ProductFormData;
  categories: CategoryOption[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (data: ProductFormData) => Promise<void> | void;
}

const STEPS = [
  { id: 1, name: "Images", description: "Photos & submit" },
  { id: 2, name: "Basic Info", description: "Product details" },
  { id: 3, name: "Details", description: "Sizes, colors & description" },
];

export function ProductFormWizard({
  title,
  submitLabel,
  initialValues,
  categories,
  loading = false,
  onCancel,
  onSubmit,
}: ProductFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Keep internal state in sync when parent supplies new initialValues
  useEffect(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    setTouchedFields((prev) => new Set(prev).add(field));
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

  // Smart validation with real-time feedback
  const getFieldError = (field: keyof ProductFormData) => {
    if (!touchedFields.has(field)) return "";
    return errors[field] || "";
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Images first
        if (!formData.imageUrl.trim())
          newErrors.imageUrl = "Main image is required";
        if (formData.stockQuantity < 0)
          newErrors.stockQuantity = "Stock quantity cannot be negative";
        break;
      case 2: // Basic Info second
        if (!formData.name.trim()) newErrors.name = "Product name is required";
        if (!formData.nameRw.trim())
          newErrors.nameRw = "Kinyarwanda name is required";
        if (!formData.price || parseFloat(formData.price) <= 0)
          newErrors.price = "Valid price is required";
        if (!formData.categoryId) newErrors.categoryId = "Category is required";
        break;
      case 3: // Details last
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1: // Images
        return !!formData.imageUrl;
      case 2: // Basic
        return !!(
          formData.name &&
          formData.nameRw &&
          formData.price &&
          formData.categoryId
        );
      case 3: // Details
        return true;
      default:
        return false;
    }
  };

  // Progress UI removed; no step status function needed

  // Determine if the full form can be submitted (all required fields across steps)
  const canSubmitForm = (): boolean => {
    const hasImages = !!formData.imageUrl?.trim();
    const hasBasic = !!(
      formData.name?.trim() &&
      formData.nameRw?.trim() &&
      formData.price &&
      parseFloat(formData.price) > 0 &&
      formData.categoryId
    );
    const hasDetails = !!formData.description?.trim();
    const nonNegativeStock = (formData.stockQuantity ?? 0) >= 0;
    return hasImages && hasBasic && hasDetails && nonNegativeStock;
  };

  // Validate all steps and navigate to the first invalid one
  const submitOrFocusInvalid = async () => {
    // Rebuild errors for all steps
    const allErrors: Record<string, string> = {};
    let firstInvalidStep: number | null = null;

    // Step 1: Images
    if (!formData.imageUrl?.trim()) {
      allErrors.imageUrl = "Main image is required";
      if (firstInvalidStep == null) firstInvalidStep = 1;
    }
    if ((formData.stockQuantity ?? 0) < 0) {
      allErrors.stockQuantity = "Stock quantity cannot be negative";
      if (firstInvalidStep == null) firstInvalidStep = 1;
    }

    // Step 2: Basic Info
    if (!formData.name?.trim()) {
      allErrors.name = "Product name is required";
      if (firstInvalidStep == null) firstInvalidStep = 2;
    }
    if (!formData.nameRw?.trim()) {
      allErrors.nameRw = "Kinyarwanda name is required";
      if (firstInvalidStep == null) firstInvalidStep = 2;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      allErrors.price = "Valid price is required";
      if (firstInvalidStep == null) firstInvalidStep = 2;
    }
    if (!formData.categoryId) {
      allErrors.categoryId = "Category is required";
      if (firstInvalidStep == null) firstInvalidStep = 2;
    }

    // Step 3: Details
    if (!formData.description?.trim()) {
      allErrors.description = "Description is required";
      if (firstInvalidStep == null) firstInvalidStep = 3;
    }

    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0 && firstInvalidStep != null) {
      setCurrentStep(firstInvalidStep);
      return;
    }

    await onSubmit(formData);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ImagesSubmitStep
            formData={formData}
            errors={errors}
            touchedFields={touchedFields}
            onInputChange={handleInputChange}
            getFieldError={getFieldError}
            removeArrayItem={removeArrayItem}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
            loading={loading}
          />
        );
      case 2:
        return (
          <BasicInfoStep
            formData={formData}
            categories={categories}
            errors={errors}
            touchedFields={touchedFields}
            onInputChange={handleInputChange}
            getFieldError={getFieldError}
          />
        );
      case 3:
        return (
          <SizesColorsDescriptionStep
            formData={formData}
            errors={errors}
            touchedFields={touchedFields}
            onInputChange={handleInputChange}
            getFieldError={getFieldError}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-2xl">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-4">
        {/* Header */}
        <div className="mb-1">
          <div className="flex items-center md:justify-between gap-2 sm:gap-3">
            {/* Back button only on first step */}
            <div className="md:w-[100px] md:sm:w-[112px] flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onCancel : prevStep}
                className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 text-xs sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline-block">
                  {currentStep === 1
                    ? title?.toLowerCase().includes("edit")
                      ? "Back to details"
                      : "Cancel"
                    : "Back"}
                </span>
              </Button>
            </div>

            {/* Centered modern title */}
            <div className="flex items-center justify-center gap-2 min-w-0">
              <div className="relative">
                {currentStep > 1 && formData.imageUrl ? (
                  <div className="">
                    <img
                      src={formData.imageUrl}
                      alt="Product thumbnail"
                      className="h-9 w-9 sm:h-12 sm:w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-md"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-sm opacity-30"
                      aria-hidden
                    />
                    <div className="relative inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-md">
                      {currentStep === 1 && (
                        <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                      )}
                      {currentStep === 2 && (
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                      )}
                      {currentStep === 3 && (
                        <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-row items-center gap-2 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate max-w-[60vw] sm:max-w-none">
                    {formData.name?.trim()
                      ? `${title}: ${formData.name}`
                      : title}
                  </h1>
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500/70 hidden xs:block" />
                </div>

                {/* Subtle subtitle with step name */}
                <div className="">
                  <p className="text-[10px] xs:text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                    Step {currentStep} of {STEPS.length}
                    {" · "}
                    {STEPS[currentStep - 1]?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: show product picture on steps 2 and 3 if available; otherwise keep spacer */}
            <div className="w-0 md:sm:w-[112px] flex-shrink-0 flex justify-end items-center"></div>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-3 mt-2 md:mt-4">{renderCurrentStep()}</div>
        {/* Navigation */}
        <div className="fixed bottom-4 md:bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
          <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onCancel : prevStep}
                className="flex items-center gap-1.5 sm:gap-2 glassmorphism border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>

              {/* Step Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden md:inline">
                  Step {currentStep} of {STEPS.length}
                </span>
                <div className="flex gap-1">
                  {STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 ${
                        index + 1 <= currentStep
                          ? "bg-blue-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Next and Submit Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentStep < STEPS.length && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed(currentStep)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 px-3 py-2 w-full sm:w-auto"
                  >
                    <span className="pl-3">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={submitOrFocusInvalid}
                  disabled={loading || !canSubmitForm()}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 px-4 sm:px-6 py-2 w-full sm:w-auto"
                >
                  {loading ? `${submitLabel}...` : submitLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for fixed navigation */}
        <div className="h-14 sm:h-16" />
      </div>
    </div>
  );
}
