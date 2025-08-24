import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Loader2,
  Wand2,
  X,
  Maximize2,
  Minimize2,
  Camera,
  Trash,
  ArrowLeft,
  ShoppingBag,
  Eye,
  Sparkles,
  Zap,
  Brain,
  Image as ImageIcon,
} from "lucide-react";

interface TryOnWidgetProps {
  productId: string;
  productImageUrl?: string;
  onUnselectProduct?: () => void;
  onNavigateToProduct?: (productId: string) => void;
  autoOpenFullscreen?: boolean;
  onRegisterControls?: (controls: {
    open: () => void;
    close: () => void;
  }) => void;
}

export default function TryOnWidget({
  productId,
  productImageUrl,
  onUnselectProduct,
  onNavigateToProduct,
  autoOpenFullscreen = true,
  onRegisterControls,
}: TryOnWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Track fullscreen transitions
  const prevIsFullscreen = useRef(isFullscreen);
  // Track previous product to clear state when switching products
  const prevProductId = useRef<string | null>(productId);

  // Helper to clear all try-on related state
  const clearAll = useCallback(() => {
    setCustomerImage(null);
    setTryOnResult(null);
    setRecommendations(null);
    setProcessed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Centralized fullscreen controls
  const openFullscreen = useCallback(() => {
    // Always start fresh when opening
    clearAll();
    setIsFullscreen(true);
  }, [clearAll]);

  const closeFullscreen = useCallback(() => {
    // Always reset to beginning when closing
    clearAll();
    setIsFullscreen(false);
  }, [clearAll]);

  // Expose controls to parent once mounted/when handlers change
  useEffect(() => {
    if (onRegisterControls) {
      onRegisterControls({ open: openFullscreen, close: closeFullscreen });
    }
  }, [onRegisterControls, openFullscreen, closeFullscreen]);

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

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      // Open modal immediately so user sees the popup while permissions are requested
      setShowCameraModal(true);
      setIsVideoReady(false);
      setCameraError(null);
      // If a previous stream exists, stop it before requesting a new one
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video is playable before marking camera as active
        const video = videoRef.current;
        const onReady = async () => {
          try {
            await video.play();
          } catch (_) {
            // autoplay may fail; user can press capture/play button
          }
          setIsCameraActive(true);
          setIsVideoReady(true);
          video.removeEventListener("loadedmetadata", onReady);
        };
        if (video.readyState >= 1 && video.videoWidth > 0) {
          // Metadata already available
          try {
            await video.play();
          } catch (_) {}
          setIsCameraActive(true);
          setIsVideoReady(true);
        } else {
          video.addEventListener("loadedmetadata", onReady);
        }
      }
    } catch (error) {
      const message =
        (error as Error)?.message ||
        "Please allow camera access to use photo capture";
      setCameraError(message);
      toast({
        title: "Camera error",
        description: message,
        variant: "destructive",
      });
      // Keep modal open so user can retry or switch permissions
    }
  }, [toast, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
    setCameraError(null);
  }, [stream]);

  const closeModal = useCallback(() => {
    // Stop camera if running, then hide modal
    stopCamera();
    setShowCameraModal(false);
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Ensure the video has valid dimensions before capture
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Camera not ready",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCustomerImage(dataUrl);
    stopCamera();
    setShowCameraModal(false);
  }, [stopCamera, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // When the modal is shown and stream is set, ensure the video attempts to play
  useEffect(() => {
    const video = videoRef.current;
    if (!showCameraModal || !video || !stream) return;
    (async () => {
      try {
        await video.play();
      } catch (_) {
        // ignore; user interaction may be required on some browsers
      }
    })();
  }, [showCameraModal, stream]);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (showCameraModal) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeModal();
      };
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [showCameraModal, closeModal]);

  // On closing fullscreen: if only an uploaded image exists and no try-on result, clear everything
  useEffect(() => {
    if (prevIsFullscreen.current && !isFullscreen) {
      if (customerImage && !tryOnResult) {
        clearAll();
      }
    }
    prevIsFullscreen.current = isFullscreen;
  }, [isFullscreen, customerImage, tryOnResult, clearAll]);

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

  // Removed auto-open on image select to honor "Open" as a fresh start action

  // Auto-open fullscreen when a product is selected/changed from TryOnStart (configurable)
  useEffect(() => {
    if (productId && autoOpenFullscreen) {
      openFullscreen();
    }
  }, [productId, autoOpenFullscreen, openFullscreen]);

  // When productId changes, clear any existing uploaded image, result, and recommendations
  useEffect(() => {
    if (
      prevProductId.current &&
      productId &&
      prevProductId.current !== productId
    ) {
      clearAll();
    }
    prevProductId.current = productId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const widgetContent = (
    <div className="space-y-3 md:space-y-4">
      {/* Mobile-Optimized Header with AI Branding */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-cyan-500/20 border border-purple-200/30 dark:border-purple-700/30 p-3 md:p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-pulse" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Brain className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-2 w-2 md:h-2.5 md:w-2.5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base md:text-lg bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent truncate">
                AI Virtual Try-On
              </h3>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Powered by advanced AI technology
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              isFullscreen ? closeFullscreen() : openFullscreen();
              onUnselectProduct && onUnselectProduct();
            }}
            className="hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 flex-shrink-0 px-2 md:px-3"
            title={isFullscreen ? "Close" : "Open"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Open</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Compact result view */}
      {!isFullscreen && tryOnResult && (
        <div className="animate-in fade-in-0 duration-700 slide-in-from-bottom-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl md:rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative rounded-2xl md:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 shadow-2xl p-3 md:p-6 group-hover:scale-[1.02] transition-all duration-500">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={tryOnResult}
                  alt="AI Try-on result"
                  className="w-full max-h-[200px] md:max-h-[280px] object-contain rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                {/* Success Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                  <Zap className="h-3 w-3" />
                  AI Ready
                </div>

                {/* Clear Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="absolute top-4 left-4 h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                  aria-label="Clear try-on"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Action */}
              <div className="mt-3 md:mt-4 flex justify-center">
                <Button
                  onClick={openFullscreen}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 md:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm md:text-base"
                >
                  <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3-column preview only when fullscreen modal is open */}
      {isFullscreen && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          {/* Enhanced Progress Steps Header */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3 md:space-x-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl md:rounded-2xl px-4 md:px-8 py-3 md:py-4 border border-white/20 dark:border-slate-700/30 shadow-sm overflow-x-auto">
              <div className="flex items-center gap-3">
                <div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    productImageUrl
                      ? "bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg scale-110"
                      : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700 text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {productImageUrl && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl blur opacity-30" />
                  )}
                  <span className="relative">1</span>
                </div>
                <div className="text-xs md:text-sm hidden sm:block">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Product
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Selected item
                  </div>
                </div>
              </div>

              <div
                className={`h-1 w-16 rounded-full transition-all duration-500 ${
                  productImageUrl
                    ? "bg-gradient-to-r from-purple-500 to-blue-600"
                    : "bg-gray-200 dark:bg-slate-600"
                }`}
              />

              <div className="flex items-center gap-3">
                <div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    customerImage
                      ? "bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg scale-110"
                      : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700 text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {customerImage && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl blur opacity-30" />
                  )}
                  <span className="relative">2</span>
                </div>
                <div className="text-xs md:text-sm hidden sm:block">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Your Photo
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Upload or capture
                  </div>
                </div>
              </div>

              <div
                className={`h-1 w-16 rounded-full transition-all duration-500 ${
                  customerImage
                    ? "bg-gradient-to-r from-purple-500 to-blue-600"
                    : "bg-gray-200 dark:bg-slate-600"
                }`}
              />

              <div className="flex items-center gap-3">
                <div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    tryOnResult
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-110"
                      : isProcessingTryOn
                      ? "bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg animate-pulse"
                      : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700 text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {(tryOnResult || isProcessingTryOn) && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl blur opacity-30" />
                  )}
                  <span className="relative">
                    {isProcessingTryOn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "3"
                    )}
                  </span>
                </div>
                <div className="text-xs md:text-sm hidden sm:block">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    AI Result
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isProcessingTryOn ? "Processing..." : "AI magic"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 items-start`}
          >
            {/* Left: Product Image */}
            <div className="order-1 md:order-1 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
              <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 dark:from-slate-800/90 dark:to-slate-700/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/50 transition-all duration-300 p-3 group">
                {productImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5">
                    <img
                      src={productImageUrl}
                      alt="Selected product"
                      className="w-full max-h-[220px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-muted/10 to-transparent p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Product image will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Middle: Upload / Capture Controls */}
            <div className="order-2 md:order-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative rounded-2xl md:rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 p-4 md:p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {!customerImage ? (
                    <div className="text-center space-y-4 md:space-y-6">
                      <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center border-2 border-dashed border-purple-300/50 dark:border-purple-600/50">
                          <ImageIcon className="h-8 w-8 md:h-10 md:w-10 text-purple-500/60" />
                        </div>
                        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                          AI Virtual Try-On
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                          Upload your photo or use camera to see how this item
                          looks on you with AI magic
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 md:gap-3">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium text-sm md:text-base"
                        >
                          <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />{" "}
                          <span className="text-sm">Choose Photo</span>
                        </Button>
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          className="border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 font-medium text-sm md:text-base"
                        >
                          <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />{" "}
                          <span className="text-sm">Take Photo</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in-0 zoom-in-95 duration-500 space-y-3 md:space-y-4">
                      <div className="relative rounded-2xl overflow-hidden group">
                        <img
                          src={customerImage}
                          alt="Your uploaded photo"
                          className="w-full max-h-[180px] md:max-h-[240px] object-contain rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                        {/* Success indicator */}
                        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex items-center gap-1 md:gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full font-medium shadow-lg">
                          <Zap className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          Ready for AI
                        </div>

                        {/* Enhanced Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 md:top-3 md:right-3 h-7 w-7 md:h-8 md:w-8 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg"
                          onClick={clearAll}
                          aria-label="Remove photo"
                        >
                          <X className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>

                      {/* Quick retry option */}
                      <div className="flex gap-1 md:gap-2 justify-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                          className="text-xs px-3 py-1.5 rounded-lg border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500"
                        >
                          <Upload className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />{" "}
                          <span className="hidden sm:inline">Change </span>Photo
                        </Button>
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          size="sm"
                          className="text-xs px-3 py-1.5 rounded-lg border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500"
                        >
                          <Camera className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />{" "}
                          Retake
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Result */}
            <div className="order-3 md:order-3 animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-300">
              <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 dark:from-slate-800/90 dark:to-slate-700/80 backdrop-blur-sm border border-white/20 dark:border-slate-600/50 hover:shadow-xl dark:shadow-slate-900/50 transition-all duration-300 p-3 group">
                {isProcessingTryOn ? (
                  <div className="flex flex-col items-center justify-center py-16 px-8">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-sm font-medium text-primary mb-2">
                        Creating your try-on...
                      </p>
                      <div className="flex items-center justify-center space-x-1">
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : tryOnResult ? (
                  <div className="animate-in fade-in-0 zoom-in-95 duration-700">
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5 border border-primary/10">
                      <img
                        src={tryOnResult}
                        alt="Try-on result"
                        className="w-full max-h-[250px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                      <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Ready
                      </div>
                    </div>
                    {/* AI Success Message */}
                    <div className="mt-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-200">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-60 animate-pulse" />
                        <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-2xl p-3 shadow-2xl">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                                  AI Magic Complete!
                                </h4>
                                <div className="flex gap-0.5">
                                  <div
                                    className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  />
                                  <div
                                    className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  />
                                  <div
                                    className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Your AI-powered try-on is ready ✨
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : processed ? (
                  <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-muted/10 to-transparent p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wand2 className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Try-on result will appear here
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-muted/30 bg-gradient-to-br from-muted/5 to-transparent p-8 text-center">
                    <div className="w-16 h-16 mx-auto my-7 rounded-full bg-muted/20 flex items-center justify-center">
                      <Wand2 className="h-16 w-16 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground/60">
                      Upload a photo to see the magic
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {processed && !tryOnResult && (
            <div className="rounded-xl border bg-card text-card-foreground shadow p-4">
              <p className="text-sm font-semibold mb-1">
                No AI image available
              </p>
              <p className="text-sm text-muted-foreground">
                We couldn’t generate a try-on image right now (likely due to AI
                quota). Please try again later or continue shopping.
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

          <div className="sticky bottom-0 left-0 right-0 mt-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
              <div className="flex gap-2"></div>
              <div className="flex gap-2 md:justify-end">
                {tryOnResult ? (
                  <>
                    <Button
                      onClick={() => {
                        if (onNavigateToProduct) {
                          onNavigateToProduct(productId);
                        } else {
                          // Fallback navigation
                          window.location.href = `/product/${productId}`;
                        }
                      }}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      View Product Details
                    </Button>
                    <Button
                      onClick={() => {
                        closeFullscreen();
                        onUnselectProduct && onUnselectProduct();
                      }}
                      variant="outline"
                      className="border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Keep Browsing
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearAll}
                      className="border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-2" /> Clear All
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleTryOn}
                      disabled={!customerImage || isProcessingTryOn}
                      className="gradient-bg text-white disabled:opacity-50"
                    >
                      {isProcessingTryOn ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                          Creating Magic...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" /> Generate Try-On
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        closeFullscreen();
                        onUnselectProduct && onUnselectProduct();
                      }}
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {!isFullscreen && (
        <div className="lg:sticky lg:top-24">{widgetContent}</div>
      )}
      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-auto p-4">
              {widgetContent}
            </div>
          </div>,
          document.body
        )}

      {/* Camera Preview Modal */}
      {showCameraModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Take Photo</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeModal}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-xl bg-black aspect-[4/3] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Loading overlay while initializing camera */}
                  {!isVideoReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                      <div className="text-white text-sm">Starting camera…</div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-3">
                    <span className="text-sm">{cameraError}</span>
                    <Button size="sm" variant="outline" onClick={startCamera}>
                      Retry
                    </Button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={capturePhoto}
                    className="flex-1 gradient-bg text-white"
                    disabled={!isVideoReady || !!cameraError}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {!isVideoReady ? "Waiting for camera" : "Take Photo"}
                  </Button>
                  <Button onClick={closeModal} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
