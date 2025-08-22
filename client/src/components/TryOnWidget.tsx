import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Wand2, X, Maximize2, Minimize2 } from "lucide-react";

interface TryOnWidgetProps {
  productId: string;
  productImageUrl?: string;
}

export default function TryOnWidget({
  productId,
  productImageUrl,
}: TryOnWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{
    fit: "perfect" | "loose" | "tight";
    confidence: number;
    suggestedSize?: string;
    notes: string;
  } | null>(null);
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [processed, setProcessed] = useState(false);

  const createTryOnMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/try-on-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          customerImageUrl: imageBase64,
        }),
      });
      if (!response.ok) throw new Error("Failed to create try-on session");
      return response.json();
    },
    onSuccess: async (session) => {
      setIsProcessingTryOn(true);
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          `/api/try-on-sessions/${session.id}/process`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ productImageUrl }),
          }
        );
        if (response.ok) {
          const result = await response.json();
          setTryOnResult(result.tryOnImageUrl || null);
          if (result.recommendations)
            setRecommendations(result.recommendations);
          setProcessed(true);
          toast({
            title: "Try-on complete!",
            description: "Your virtual try-on is ready",
          });
          if (result.error) {
            toast({
              title: "Using demo fallback",
              description:
                "AI quota reached; showing a preview using your uploaded photo.",
            });
          }
        } else {
          throw new Error("Try-on processing failed");
        }
      } catch (error) {
        toast({
          title: "Try-on failed",
          description: "Please try again with a different photo",
          variant: "destructive",
        });
      } finally {
        setIsProcessingTryOn(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Compress image to stay under ~2MB by reducing dimensions/quality iteratively
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessed(false);

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      // Read file as data URL
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create image for canvas resizing
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });

      const targetBytes = 2 * 1024 * 1024; // ~2MB
      let quality = 0.85;
      let maxDim = 1400;
      let compressedDataUrl = dataUrl;

      for (let i = 0; i < 5; i++) {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");
        ctx.drawImage(img, 0, 0, width, height);

        compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        // Estimate size from base64 length
        const approxBytes = Math.ceil(
          ((compressedDataUrl.length - "data:image/jpeg;base64,".length) * 3) /
            4
        );
        if (approxBytes <= targetBytes) break;

        // Reduce further and try again
        quality = Math.max(0.6, quality - 0.1);
        maxDim = Math.max(800, Math.round(maxDim * 0.85));
      }

      setCustomerImage(compressedDataUrl);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Could not process the selected image",
        variant: "destructive",
      });
    }
  };

  const handleTryOn = async () => {
    try {
      setIsProcessingTryOn(true);
      setProcessed(false);
      if (!customerImage) {
        toast({
          title: "Upload a photo first",
          description: "Please upload your photo to continue",
        });
        return;
      }
      createTryOnMutation.mutate(customerImage);
    } catch (error) {
      toast({
        title: "Try-on failed",
        description: "Please try again with a different photo",
        variant: "destructive",
      });
    }
  };

  const Content = (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">AI Try-On Preview</p>
        </div>
        <Button
          variant="ghost"
          className="glassmorphism"
          onClick={() => setIsFullscreen((v) => !v)}
          title={isFullscreen ? "Exit Fullscreen" : "Expand"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4 mr-2" /> Close Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-2" /> Expand
            </>
          )}
        </Button>
      </div>
      {!customerImage ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload your photo to see how this item looks on you
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gradient-bg text-white"
          >
            Choose Photo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {productImageUrl && (
              <div className="text-center order-2 md:order-1">
                <p className="text-sm font-medium mb-2">Product Image</p>
                <img
                  src={productImageUrl}
                  alt="Product"
                  className={
                    isFullscreen
                      ? "w-full object-contain rounded-xl"
                      : "w-full object-cover rounded-xl"
                  }
                  style={{
                    maxHeight: isFullscreen ? "300px" : "200px",
                  }}
                />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Your Photo</p>
              <img
                src={customerImage}
                alt="Customer"
                className={
                  isFullscreen
                    ? "w-full object-contain rounded-xl"
                    : "w-full object-cover rounded-xl"
                }
                style={{
                  maxHeight: isFullscreen ? "300px" : "250px",
                }}
              />
            </div>
            {tryOnResult && (
              <div className="text-center order-3 w-full">
                <p className="text-sm font-medium mb-2">
                  <span className="truncate">Try-On Result</span>
                </p>
                <img
                  src={tryOnResult}
                  alt="Try-on result"
                  className={
                    isFullscreen
                      ? "max-h-[400px] w-full object-contain rounded-xl"
                      : "w-full h-32 object-cover rounded-xl"
                  }
                />
              </div>
            )}
          </div>

          {processed && !tryOnResult && (
            <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
              <p className="text-sm font-semibold mb-1">No AI image available</p>
              <p className="text-sm text-muted-foreground">
                We couldn’t generate a try-on image right now (likely due to AI quota). Please try again later or continue shopping.
              </p>
            </div>
          )}

          {recommendations && (
            <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
              <p className="text-sm font-semibold mb-2">Fit Recommendation</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Fit: </span>
                  <span className="capitalize">{recommendations.fit}</span>
                </div>
                {recommendations.suggestedSize && (
                  <div>
                    <span className="text-muted-foreground">
                      Suggested size:{" "}
                    </span>
                    <span>{recommendations.suggestedSize}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Confidence: </span>
                  <span>{Math.round(recommendations.confidence * 100)}%</span>
                </div>
              </div>
              {recommendations.notes && (
                <p className="text-sm mt-2 text-muted-foreground">
                  {recommendations.notes}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleTryOn}
              disabled={isProcessingTryOn}
              className="flex-1 gradient-bg text-white"
            >
              {isProcessingTryOn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" /> Generate Try-On
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCustomerImage(null);
                setTryOnResult(null);
                setRecommendations(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {!isFullscreen && <div className="lg:sticky lg:top-24">{Content}</div>}
      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-auto p-4">
              {Content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
