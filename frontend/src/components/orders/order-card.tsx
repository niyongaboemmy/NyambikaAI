import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { ProducerOrder } from "@/types/order";

const STATUS_CONFIG = {
  pending: {
    color:
      "bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50",
    label: "Pending",
    icon: "⏳",
  },
  confirmed: {
    color:
      "bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
    label: "Confirmed",
    icon: "✓",
  },
  processing: {
    color:
      "bg-purple-100/80 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
    label: "Processing",
    icon: "⚙️",
  },
  shipped: {
    color:
      "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50",
    label: "Shipped",
    icon: "🚚",
  },
  delivered: {
    color:
      "bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50",
    label: "Delivered",
    icon: "✓",
  },
  cancelled: {
    color:
      "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50",
    label: "Cancelled",
    icon: "✕",
  },
} as const;

interface OrderCardProps {
  order: ProducerOrder;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusUpdate: (status: string) => void;
  onViewDetails: () => void;
}

export function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  onStatusUpdate,
  onViewDetails,
}: OrderCardProps) {
  const status = order.status as keyof typeof STATUS_CONFIG;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const nextStatusOptions = Object.entries(STATUS_CONFIG).filter(([key]) => {
    if (status === "cancelled") return false;
    if (status === "delivered") return key === "cancelled";
    if (status === "shipped") return key === "delivered" || key === "cancelled";
    if (status === "processing")
      return key === "shipped" || key === "cancelled";
    if (status === "confirmed")
      return key === "processing" || key === "cancelled";
    if (status === "pending") return key === "confirmed" || key === "cancelled";
    return false;
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <CardTitle className="text-sm sm:text-lg font-semibold truncate">
                Order #{order.id.slice(-6).toUpperCase()}
              </CardTitle>
              <Badge className={cn("text-xs font-medium flex-shrink-0", statusConfig.color)}>
                <span className="hidden sm:inline">{statusConfig.icon} </span>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              <span className="hidden sm:inline">
                {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
              </span>
              <span className="sm:hidden">
                {format(new Date(order.createdAt), "MMM d, yyyy")}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="sr-only">
              {isExpanded ? "Collapse" : "Expand"} order details
            </span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">{order.customerName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} • {formatPrice(order.total)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 sm:gap-1.5 text-xs sm:text-sm w-full sm:w-auto"
            onClick={onViewDetails}
          >
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">Details</span>
            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </CardContent>

      {isExpanded && (
        <div className="p-3 sm:p-4 pt-0 border-t flex flex-col gap-3">
          <div className="w-full">
            <h4 className="text-xs sm:text-sm font-medium mb-2">Order Items</h4>
            <div className="space-y-1 sm:space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                  <div className="flex-1 truncate pr-2">
                    <span className="font-medium">{item.quantity}×</span>{" "}
                    <span className="truncate">{item.product?.name || "Product"}</span>
                  </div>
                  <div className="flex-shrink-0 font-medium">{formatPrice(item.price)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full pt-2 border-t">
            <h4 className="text-xs sm:text-sm font-medium mb-2">Update Status</h4>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {nextStatusOptions.map(([status, config]) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "text-xs px-2 py-1 sm:px-3 sm:py-2",
                    status === "cancelled"
                      ? "text-destructive hover:text-destructive"
                      : ""
                  )}
                  onClick={() => onStatusUpdate(status)}
                >
                  <span className="hidden sm:inline">{config.icon} </span>
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
