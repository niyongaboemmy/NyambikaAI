import React from "react";
import { ProductFormWizard } from "./ProductFormWizard";

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

function ProductForm({
  title,
  submitLabel,
  initialValues,
  categories,
  loading = false,
  onCancel,
  onSubmit,
}: ProductFormProps) {
  return (
    <ProductFormWizard
      title={title}
      submitLabel={submitLabel}
      initialValues={initialValues}
      categories={categories}
      loading={loading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
}

export default ProductForm;
