import React, { memo } from "react";
import Image from "next/image";
import type { Product } from "@/shared/types/product";
import { Button } from "@/components/custom-ui/button";
import { Heart, Pencil, Trash, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
  onBoost?: (productId: string) => void;
  showBoostLabel?: boolean;
  containerClassName?: string;
  hideActions?: boolean;
  onCardClick?: (productId: string) => void;
  selected?: boolean;
  hideDesc?: boolean;
  compact?: boolean;
  imagePriority?: boolean;
  imageFetchPriority?: "high" | "low" | "auto";
};

function formatPrice(price: string | number) {
  // Handle null/undefined cases
  if (price === null || price === undefined) return 'RWF 0';
  
  // Convert string to number if needed
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  
  // Handle NaN case
  if (isNaN(numPrice)) return 'RWF 0';
  
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  })
    .format(numPrice)
    .replace("RWF", "RWF");
}

// Memoize to avoid re-rendering every card on list-level state changes
export default memo(ProductCard, (prev, next) => {
  // Compare primitive props and identifiers that affect rendering
  if (prev.product.id !== next.product.id) return false;
  if (prev.isFavorited !== next.isFavorited) return false;
  if (prev.selected !== next.selected) return false;
  if (prev.hideDesc !== next.hideDesc) return false;
  if (prev.compact !== next.compact) return false;
  if (prev.isAdmin !== next.isAdmin) return false;
  if (prev.isProducer !== next.isProducer) return false;
  if (prev.currentUserId !== next.currentUserId) return false;
  if (prev.showBoostLabel !== next.showBoostLabel) return false;
  if (prev.containerClassName !== next.containerClassName) return false;
  // Assume callbacks are stable (useCallback in parent); if not, card will re-render.
  return (
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.onViewDetails === next.onViewDetails &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onBoost === next.onBoost &&
    prev.onCardClick === next.onCardClick &&
    prev.hideActions === next.hideActions
  );
});

 

function ProductCard({
  product,
  isAdmin,
  isProducer,
  currentUserId,
  isFavorited,
  onToggleFavorite,
  onViewDetails,
  onEdit,
  onDelete,
  onBoost,
  showBoostLabel,
  containerClassName,
  hideActions,
  onCardClick,
  selected,
  hideDesc,
  compact,
  imagePriority,
  imageFetchPriority,
}: ProductCardProps) {
  const { language } = useLanguage();
  const primaryName = language === "rw" ? (product.nameRw || product.name) : product.name;
  const subtitleName = language === "rw" ? product.name : undefined;
  const canManage = !!(
    isAdmin ||
    (isProducer && product.producerId === currentUserId)
  );

  return (
    <div
      className={cn(
        "col-span-6 md:col-span-4 lg:col-span-2 group relative overflow-hidden rounded-md bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 [content-visibility:auto] [contain-intrinsic-size:400px]",
        selected && "ring-2 ring-blue-400 shadow-blue-200/50",
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
      <div
        className={cn(
          "relative overflow-hidden mb-2 md:pb-2 lg:mb-2",
          compact ? "" : ""
        )}
      >
        <Image
          src={product.imageUrl || "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500"}
          alt={primaryName || "Product image"}
          width={600}
          height={600}
          sizes="(min-width: 1024px) 16.66vw, (min-width: 768px) 25vw, 50vw"
          quality={70}
          loading={imagePriority ? undefined : "lazy"}
          priority={!!imagePriority}
          fetchPriority={imageFetchPriority ?? "low"}
          placeholder="empty"
          className="w-full h-full rounded-t-md aspect-square object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
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
            "absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200",
            isFavorited ? "text-red-500 opacity-100" : "text-gray-700"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </Button>

        {canManage && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 transition-all duration-200">
            {onEdit && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product.id);
                }}
                aria-label="Edit product"
                title="Edit"
              >
                <Pencil className="h-4 w-4 text-gray-700" />
              </Button>
            )}
            {onBoost && (
              <Button
                size={showBoostLabel ? "sm" : "icon"}
                variant="default"
                className={cn(
                  "rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg",
                  showBoostLabel ? "h-8 px-2" : "h-8 w-8"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onBoost(product.id);
                }}
                aria-label="Boost product"
                title="Boost to top"
              >
                <Zap className="h-4 w-4" />
                {showBoostLabel && (
                  <span className="mr-1 text-xs font-semibold">Boost</span>
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-500 shadow-lg"
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
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product.id);
              }}
              className="pointer-events-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
              aria-label="View details"
              title="View details"
            >
              View Details
            </Button>
          </div>
        )}
      </div>

      <div
        className={cn(
          "space-y-1 px-0.5 text-center",
          compact ? "p-2 pt-2" : "p-4 pt-2"
        )}
      >
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product.id);
          }}
        >
          <h3
            className={cn(
              "font-bold text-gray-900 dark:text-gray-100 truncate leading-tight",
              compact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"
            )}
          >
            {primaryName}
          </h3>
          {!hideDesc && language === "rw" && subtitleName && (
            <p
              className={cn(
                "text-gray-600 dark:text-gray-400 truncate mb-2",
                compact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"
              )}
            >
              {subtitleName}
            </p>
          )}
          <div className="text-center">
            <span
              className={cn(
                "font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                compact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"
              )}
            >
              {typeof product.price === "number"
                ? formatPrice(product.price)
                : formatPrice(Number(product.price))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
