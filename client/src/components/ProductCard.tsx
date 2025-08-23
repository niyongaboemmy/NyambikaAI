import React from "react";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Heart, Pencil, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductCardProps = {
  product: Product;
  isAdmin?: boolean;
  isProducer?: boolean;
  currentUserId?: string;
  isFavorited?: boolean;
  onToggleFavorite: (productId: string) => void;
  onViewDetails: (productId: string) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  containerClassName?: string;
  hideActions?: boolean;
  onCardClick?: (productId: string) => void;
  selected?: boolean;
  hideDesc?: boolean;
};

function formatPrice(price: string | number) {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  })
    .format(numPrice)
    .replace("RWF", "RWF");
}

export default function ProductCard({
  product,
  isAdmin,
  isProducer,
  currentUserId,
  isFavorited,
  onToggleFavorite,
  onViewDetails,
  onEdit,
  onDelete,
  containerClassName,
  hideActions,
  onCardClick,
  selected,
  hideDesc,
}: ProductCardProps) {
  const canManage = !!(
    isAdmin ||
    (isProducer && product.producerId === currentUserId)
  );

  return (
    <div
      className={cn(
        "col-span-12 md:col-span-4 lg:col-span-2 group floating-card p-2 pb-3 neumorphism rounded-xl",
        selected && "ring-2 ring-blue-200 border-blue-500",
        containerClassName
      )}
      onClick={onCardClick ? () => onCardClick(product.id) : undefined}
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      aria-pressed={onCardClick ? !!selected : undefined}
      aria-selected={onCardClick ? !!selected : undefined}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCardClick(product.id);
              }
            }
          : undefined
      }
    >
      <div className="relative overflow-hidden rounded-2xl mb-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product.id);
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className={cn(
            "absolute top-2 right-2 glassmorphism rounded-full p-2",
            isFavorited ? "text-red-500" : "text-gray-600 dark:text-gray-300"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </Button>

        {canManage && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
            {onEdit && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full glassmorphism"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product.id);
                }}
                aria-label="Edit product"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
                aria-label="Delete product"
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {!hideActions && (
          <div className="absolute inset-0 hidden sm:flex items-center justify-center z-10 pointer-events-none">
            {/* Soft gradient backdrop for contrast */}
            {/* <div className="absolute inset-x-6 bottom-6 top-6 rounded-2xl bg-gradient-to-t from-black/25 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" /> */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product.id);
              }}
              className="pointer-events-auto gradient-bg text-white px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="View details"
              title="View details"
            >
              View Details
            </Button>
          </div>
        )}
      </div>

      <div
        className="space-y-0 text-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails(product.id);
        }}
      >
        <div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 truncate">
            {product.name}
          </h3>
          {!hideDesc && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {product.nameRw}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-[rgb(var(--electric-blue-rgb))]">
            {typeof product.price === "number"
              ? formatPrice(product.price)
              : formatPrice(Number(product.price))}
          </span>
          {false && !hideActions && null}
        </div>

        {false && canManage && null}
      </div>
    </div>
  );
}
