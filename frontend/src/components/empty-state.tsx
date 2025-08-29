import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No orders found",
  description = "When you receive orders, they will appear here.",
  actionText = "Refresh",
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <PackageSearch className="h-12 w-12 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground">
        <p>{description}</p>
        {onAction && (
          <div className="mt-6">
            <Button variant="outline" onClick={onAction}>
              {actionText}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
