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
} from "lucide-react";

interface TryOnWidgetProps {
  productId: string;
  productImageUrl?: string;
  onUnselectProduct?: () => void;
}

export default function TryOnWidget({
  productId,
  productImageUrl,
  onUnselectProduct,
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

  // Auto-open fullscreen when an image is selected or captured
  useEffect(() => {
    if (customerImage) {
      setIsFullscreen(true);
    }
  }, [customerImage]);

  // Auto-open fullscreen when a product is selected/changed from TryOnStart
  useEffect(() => {
    if (productId) {
      setIsFullscreen(true);
    }
  }, [productId]);

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
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="glassmorphism h-8 px-2"
            onClick={() => {
              if (isFullscreen) {
                setIsFullscreen(false);
                return;
              }
              if (onUnselectProduct) {
                onUnselectProduct();
                return;
              }
              window.history.back();
            }}
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </Button>
          <p className="text-xl font-extrabold">Virtual Try-On Studio</p>
        </div>
        {isFullscreen && (
          <Button
            variant={isFullscreen ? "secondary" : "ghost"}
            className={
              isFullscreen
                ? "border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 dark:text-red-300"
                : "glassmorphism"
            }
            onClick={() => {
              setIsFullscreen((v) => {
                const next = !v;
                if (next) {
                  onUnselectProduct?.();
                }
                return next;
              });
            }}
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
        )}
      </div>
      {/* Upload controls (visible when there's no photo yet, not fullscreen, and no result) */}
      {!customerImage && !isFullscreen && !tryOnResult && (
        <div className="animate-in fade-in-0 duration-500">
          {productImageUrl && (
            <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border shadow-lg transition-all duration-300 p-4 group mb-4">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5 border border-primary/10">
                <img
                  src={productImageUrl}
                  alt="Selected product"
                  className="w-full max-h-[150px] object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
              </div>
            </div>
          )}
          <div className="glassmorphism rounded-3xl p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                AI Virtual Try-On
              </h3>
              <p className="text-muted-foreground mb-5 leading-relaxed">
                Upload your photo or use camera to see how this item looks on
                you
              </p>
              <div className="flex flex-col gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="gradient-bg text-white hover:scale-105 transition-all duration-200 hover:shadow-lg"
                >
                  <Upload className="h-4 w-4 mr-2" /> Choose Photo
                </Button>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="hover:scale-105 transition-all duration-200 border-primary/20 hover:border-primary/40"
                >
                  <Camera className="h-4 w-4 mr-2" /> Take Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact result view when modal is closed and result exists */}
      {!isFullscreen && tryOnResult && (
        <div className="animate-in fade-in-0 duration-500">
          <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border shadow-lg transition-all duration-300 p-4 group">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5 border border-primary/10">
              <img
                src={tryOnResult}
                alt="Try-on result"
                className="w-full max-h-[300px] object-contain rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
              <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                Ready
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomerImage(null);
                  setTryOnResult(null);
                  setRecommendations(null);
                  setProcessed(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Clear try-on"
                className="absolute top-3 left-3 h-8 w-8 p-0 border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3-column preview only when fullscreen modal is open */}
      {isFullscreen && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          {/* Progress Steps Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    productImageUrl
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Product</span>
              </div>
              <div
                className={`h-0.5 w-12 transition-all duration-300 ${
                  productImageUrl ? "bg-primary" : "bg-muted"
                }`}
              ></div>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    customerImage
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Your Photo</span>
              </div>
              <div
                className={`h-0.5 w-12 transition-all duration-300 ${
                  customerImage ? "bg-primary" : "bg-muted"
                }`}
              ></div>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    tryOnResult
                      ? "bg-primary text-primary-foreground"
                      : isProcessingTryOn
                      ? "bg-primary/60 text-primary-foreground animate-pulse"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Result</span>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start`}>
            {/* Left: Product Image */}
            <div className="order-1 md:order-1 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
              <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border transition-all duration-300 p-3 group">
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

            {/* Middle: Upload / Capture Controls */}
            <div className="order-2 md:order-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
              <div className="glassmorphism rounded-3xl p-4 group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {!customerImage ? (
                  <div className="text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary/60" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-500" />
                        AI Virtual Try-On
                      </h3>
                      <p className="text-muted-foreground mb-5 leading-relaxed">
                        Upload your photo or use camera to see how this item
                        looks on you
                      </p>
                      <div className="flex flex-col gap-3 justify-center w-full">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="gradient-bg text-white hover:scale-105 transition-all duration-200 hover:shadow-lg"
                        >
                          <Upload className="h-4 w-4 mr-2" /> Choose Photo
                        </Button>
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          className="hover:scale-105 transition-all duration-200 border-primary/20 hover:border-primary/40"
                        >
                          <Camera className="h-4 w-4 mr-2" /> Take Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in-0 zoom-in-95 duration-500">
                    <div className="relative rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 borde border-primary/20 p-2 overflow-hidden">
                      <img
                        src={customerImage}
                        alt="Your uploaded photo"
                        className="w-full max-h-[220px] object-contain rounded-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                      <div className="absolute top-2 right-2 z-10 group">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full bg-red-500/20 text-red-600 shadow-sm border border-red-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-red-200/80 hover:scale-110 hover:-rotate-6 focus-visible:ring-2 focus-visible:ring-red-500/50"
                          onClick={clearAll}
                          aria-label="Remove photo"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/60 text-white opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none">
                          Remove
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Result */}
            <div className="order-3 md:order-3 animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-300">
              <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300 p-3 group">
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
                    {/* Congratulation Message */}
                    <div className="mt-4 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-sm">🎉</span>
                          </div>
                          <h4 className="text-lg font-semibold text-green-700 dark:text-green-400">
                            Well Done!
                          </h4>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          Your virtual try-on is ready! See how amazing you look
                          in this item.
                        </p>
                      </div>
                    </div>
                    {/* Confirm & Continue Button */}
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={() => setIsFullscreen(false)}
                        className="gradient-bg text-white hover:scale-105 transition-all duration-200 hover:shadow-lg"
                      >
                        Confirm & Continue
                      </Button>
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
                      onClick={() => setIsFullscreen(false)}
                    >
                      Collapse
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-auto p-4">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
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
