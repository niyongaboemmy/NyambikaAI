"use client";

import { useState } from "react";
import { Button } from "@/components/custom-ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateOrderValidationStatus } from "@/hooks/use-orders";

interface OrderConfirmationButtonProps {
  orderId: string;
  isConfirmed: boolean;
  onConfirmationChange?: (confirmed: boolean) => void;
}

export function OrderConfirmationButton({
  orderId,
  isConfirmed,
  onConfirmationChange,
}: OrderConfirmationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const mutation = useUpdateOrderValidationStatus();

  const handleConfirmation = async () => {
    if (isConfirmed) return; // Already confirmed

    setIsLoading(true);
    try {
      await mutation.mutateAsync({
        id: orderId,
        validationStatus: "confirmed_by_customer",
      });

      onConfirmationChange?.(true);
      toast({
        title: "Order Confirmed",
        description: "Thank you for confirming receipt of your order!",
      });
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm order receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfirmed) {
    return (
      <Button
        variant="outline"
        disabled
        className="bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-300"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Order Confirmed
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConfirmation}
      disabled={isLoading}
      className="text-white bg-gold-600 hover:bg-gold-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Confirming...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirm Receipt
        </>
      )}
    </Button>
  );
}
