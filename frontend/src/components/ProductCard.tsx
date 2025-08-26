import React from "react";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Check, Heart, Pencil, SendToBack, Trash } from "lucide-react";
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
  compact?: boolean;
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
  compact,
}: ProductCardProps) {
  const canManage = !!(
    isAdmin ||
    (isProducer && product.producerId === currentUserId)
  );

  return (
    <div
      className={cn(
        "col-span-6 md:col-span-4 lg:col-span-2 group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1",
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
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="min-h-full min-w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
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
            "absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200",
            isFavorited ? "text-red-500 opacity-100" : "text-gray-700"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </Button>

        {canManage && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
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
            {product.name}
          </h3>
          {!hideDesc && (
            <p
              className={cn(
                "text-gray-600 dark:text-gray-400 truncate mb-2",
                compact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"
              )}
            >
              {product.nameRw}
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
