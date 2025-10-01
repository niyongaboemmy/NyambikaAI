"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/custom-ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Loader2,
  ShoppingBag,
  Upload,
  Wand2,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useSafeToast as useToast } from "@/hooks/use-safe-toast";

interface TryOnWidgetProps {
  productId: string;
  productImageUrl?: string;
  productName: string;
  productPrice: string;
  otherImages: string[];
  onUnselectProduct?: () => void;
  onNavigateToProduct?: (productId: string) => void;
  onRegisterControls?: (controls: {
    open: () => void;
    close: () => void;
  }) => void;
  onBack?: () => void;
}

export default function TryOnWidget({
  productId,
  productImageUrl,
  onUnselectProduct,
  onNavigateToProduct,
  onRegisterControls,
  productName,
  productPrice,
  otherImages,
  onBack,
}: TryOnWidgetProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { open: openLoginPrompt } = useLoginPrompt();
  const router = useRouter();

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Performance monitoring
  const perfRef = useRef({
    cameraStartTime: 0,
    lastFrameTime: 0,
    frameCount: 0,
    droppedFrames: 0,
  });

  // State
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [selectedGarmentUrl, setSelectedGarmentUrl] = useState<string | null>(
    productImageUrl ?? null
  );
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(() =>
    typeof window !== "undefined" &&
    localStorage.getItem("nyambika-camera-facing") === "environment"
      ? "environment"
      : "user"
  );
  const [hasFrontCamera, setHasFrontCamera] = useState(true);
  const [hasBackCamera, setHasBackCamera] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  // Persist selected garment in localStorage
  const getStorageKey = useCallback(
    () => `nyambika-selected-garment-${productId}`,
    [productId]
  );

  // Load persisted selection on mount
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey());
    if (
      stored &&
      (stored === productImageUrl || otherImages?.includes(stored))
    ) {
      setSelectedGarmentUrl(stored);
    } else {
      setSelectedGarmentUrl(productImageUrl ?? null);
    }
  }, [productImageUrl, otherImages, productId, getStorageKey]);

  // Save selection to localStorage when changed
  useEffect(() => {
    if (selectedGarmentUrl) {
      localStorage.setItem(getStorageKey(), selectedGarmentUrl);
    }
  }, [selectedGarmentUrl, getStorageKey]);

  // Detect device type and performance characteristics
  useEffect(() => {
    const checkDevice = () => {
      try {
        const isClient =
          typeof window !== "undefined" && typeof navigator !== "undefined";
        let isMobileDevice = false;

        if (isClient) {
          // Mobile detection
          const userAgent = navigator.userAgent?.toLowerCase() || "";
          isMobileDevice =
            /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
              userAgent
            );

          // Performance detection with fallbacks
          const hardwareConcurrency =
            (navigator as any).hardwareConcurrency || 4; // Default to 4 if not available
          const deviceMemory = (navigator as any).deviceMemory || 4; // Default to 4GB if not available

          const isLowEndDevice =
            hardwareConcurrency <= 2 || // 2 or fewer CPU cores
            deviceMemory < 2; // Less than 2GB RAM

          setIsLowPerformance(isLowEndDevice);

          console.log(
            `[Camera] Device: ${isMobileDevice ? "Mobile" : "Desktop"}, ` +
              `Cores: ${hardwareConcurrency}, RAM: ${deviceMemory}GB, ` +
              `Performance: ${isLowEndDevice ? "Low" : "Normal"}`
          );
        }

        setIsMobile(isMobileDevice);
      } catch (error) {
        console.error("[Camera] Error detecting device capabilities:", error);
        // Set safe defaults on error
        setIsMobile(false);
        setIsLowPerformance(false);
      }
    };

    // Only run on client-side
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      checkDevice();
      window.addEventListener("resize", checkDevice);
      return () => window.removeEventListener("resize", checkDevice);
    }
  }, []);

  // Cleanup camera resources on unmount
  useEffect(() => {
    return () => {
      // Cleanup camera if open
      if (stream) {
        console.log("[Camera] Cleaning up camera stream");
        stream.getTracks().forEach((track) => {
          track.stop();
          if (track.readyState === "live") {
            track.enabled = false;
          }
        });
        setStream(null);
      }

      // Clean up any video element references
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }

      // Force garbage collection on low-end devices
      if (isLowPerformance && "gc" in window) {
        // @ts-ignore - gc is not in TypeScript's type definitions
        window.gc();
      }
    };
  }, [stream, isLowPerformance]);

  // Controls registration
  const openFullscreen = useCallback(() => {}, []);
  const closeFullscreen = useCallback(() => {
    onUnselectProduct && onUnselectProduct();
  }, [onUnselectProduct]);

  useEffect(() => {
    onRegisterControls?.({ open: openFullscreen, close: closeFullscreen });
  }, [onRegisterControls, openFullscreen, closeFullscreen]);

  // Handlers
  const clearAll = useCallback(() => {
    // Revoke any previous blob URL
    setTryOnResult((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    // Reset primary states
    setCustomerImage(null);
    setIsProcessingTryOn(false);
    setCelebrate(false);
    setCameraError(null);
    // Stop camera if running
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    // Also clear any canvas content
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx)
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [stream]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCustomerImage(reader.result as string);
        setTryOnResult(null);
        toast({
          title: "Image Uploaded",
          description: "Photo added successfully.",
        });
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsVideoReady(false);
      perfRef.current.cameraStartTime = performance.now();
      perfRef.current.frameCount = 0;
      perfRef.current.droppedFrames = 0;
      perfRef.current.lastFrameTime = 0;

      // Clean up existing stream if any
      if (stream) {
        console.log("[Camera] Cleaning up previous stream");
        stream.getTracks().forEach((track) => {
          track.stop();
          if (track.readyState === "live") {
            track.enabled = false;
          }
        });
        setStream(null);
      }

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error("Camera is not supported in this browser");
      }

      // Check if we have camera permissions
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        if (videoDevices.length === 0) {
          throw new Error("No video input devices found");
        }

        console.log(`[Camera] Found ${videoDevices.length} video devices`);
      } catch (err) {
        console.error("[Camera] Error checking devices:", err);
      }

      // Optimize constraints based on device capabilities
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      // Start with minimal constraints
      const baseConstraints: MediaTrackConstraints = {
        width: { min: 640, ideal: 1280 },
        height: { min: 480, ideal: 720 },
        frameRate: { ideal: 24, max: 30 },
        aspectRatio: { ideal: 16 / 9 },
      };

      // Apply more specific constraints for desktop
      if (!isMobile) {
        baseConstraints.width = { min: 1280, ideal: 1920 };
        baseConstraints.height = { min: 720, ideal: 1080 };
      }

      // Create constraints object
      const constraints: MediaStreamConstraints = {
        video: {
          ...baseConstraints,
          facingMode: { ideal: cameraFacing },
        },
        audio: false,
      };

      console.log("[Camera] Using constraints:", constraints);

      // Special handling for iOS/Safari - use simpler constraints
      if (isIOS || isSafari) {
        console.log(
          "[Camera] iOS/Safari detected, using simplified constraints"
        );
        constraints.video = {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 },
        };
      }

      console.log("[Camera] Requesting camera with constraints:", constraints);
      const media = await navigator.mediaDevices.getUserMedia(constraints);
      // Set up performance monitoring
      const track = media.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        console.log("[Camera] Active camera settings:", {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          deviceId: settings.deviceId,
        });

        // Monitor frame rate
        if (
          "requestVideoFrameCallback" in HTMLVideoElement.prototype &&
          videoRef.current
        ) {
          let lastTime = performance.now();
          let frames = 0;

          const checkFramerate = (now: number) => {
            frames++;
            if (now - lastTime >= 1000) {
              const fps = Math.round((frames * 1000) / (now - lastTime));
              frames = 0;
              lastTime = now;

              // Log if FPS drops below threshold
              if (fps < 15) {
                console.warn(`[Camera] Low FPS detected: ${fps}`);
                // Auto-adapt quality if FPS is too low
                if (fps < 10 && !isLowPerformance) {
                  console.log("[Camera] Enabling low performance mode");
                  setIsLowPerformance(true);
                }
              }
            }
            if (videoRef.current) {
              videoRef.current.requestVideoFrameCallback(checkFramerate);
            }
          };

          if (videoRef.current) {
            videoRef.current.requestVideoFrameCallback(checkFramerate);
          }
        }
      }

      setStream(media);

      // After permission granted, update camera availability from device list
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videos = devices.filter((d) => d.kind === "videoinput");
          let front = false;
          let back = false;

          // Use a more reliable method to detect front/back cameras
          for (const d of videos) {
            const lbl = (d.label || "").toLowerCase();
            const isFront =
              lbl.includes("front") ||
              lbl.includes("user") ||
              lbl.includes("webcam") ||
              lbl.includes("face") ||
              d.deviceId.includes("facing:user");

            const isBack =
              lbl.includes("back") ||
              lbl.includes("rear") ||
              lbl.includes("environment") ||
              d.deviceId.includes("facing:environment");

            if (isFront) front = true;
            if (isBack) back = true;
          }

          // Fallback to device count if we couldn't determine from labels
          if (!front && !back) {
            if (videos.length >= 2) {
              front = true;
              back = true;
            } else if (videos.length === 1) {
              front = true;
              back = false;
            }
          }

          console.log(
            `[Camera] Detected cameras - Front: ${front}, Back: ${back}`
          );
          setHasFrontCamera(front);
          setHasBackCamera(back);
        } catch (error) {
          console.error("[Camera] Error enumerating devices:", error);
        }
      }
      if (videoRef.current) {
        const v = videoRef.current;

        // Clear any existing handlers and timeouts
        v.onloadedmetadata = null;
        v.oncanplay = null;
        v.onplay = null;
        v.onpause = null;
        v.onerror = null;

        // Set source
        v.srcObject = media;
        v.playsInline = true;
        v.muted = true;
        v.setAttribute("playsinline", "");
        v.setAttribute("webkit-playsinline", "");

        // Helper to mark ready safely with performance logging
        const markReady = () => {
          if (isVideoReady) return;

          const now = performance.now();
          const timeToReady = now - perfRef.current.cameraStartTime;

          if (v.videoWidth > 0 && v.videoHeight > 0) {
            console.log(
              `[Camera] Video ready in ${timeToReady.toFixed(
                0
              )}ms, resolution: ${v.videoWidth}x${v.videoHeight}`
            );
            setIsVideoReady(true);

            // Log initial performance metrics
            if (perfRef.current.cameraStartTime > 0) {
              console.log(
                `[Performance] Camera initialization took ${timeToReady.toFixed(
                  0
                )}ms`
              );
            }
          } else if (v.readyState >= 2) {
            console.log(
              `[Camera] Video ready (fallback) in ${timeToReady.toFixed(0)}ms`
            );
            setIsVideoReady(true);
          }
        };

        // Set up event handlers with error handling
        const onError = (e: any) => {
          console.error("[Camera] Video error:", e);
          setCameraError("Failed to initialize camera stream");
        };

        v.onloadedmetadata = () => {
          console.log("[Camera] Metadata loaded, starting playback");
          const playPromise = v.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("[Camera] Playback started successfully");
                markReady();
              })
              .catch((err) => {
                console.error("[Camera] Playback error:", err);

                // Try again with user interaction fallback
                if (err.name === "NotAllowedError") {
                  console.log(
                    "[Camera] Attempting to recover from autoplay restriction"
                  );
                  const playAfterInteraction = () => {
                    document.removeEventListener("click", playAfterInteraction);
                    document.removeEventListener(
                      "touchstart",
                      playAfterInteraction
                    );
                    v.play().catch((e) =>
                      console.error("[Camera] Recovery play failed:", e)
                    );
                  };
                  document.addEventListener("click", playAfterInteraction, {
                    once: true,
                  });
                  document.addEventListener(
                    "touchstart",
                    playAfterInteraction,
                    { once: true }
                  );
                }

                markReady(); // Still mark as ready to show something
              });
          }
        };

        v.oncanplay = markReady;
        v.onplay = () => console.log("[Camera] Video playback started");
        v.onpause = () => console.log("[Camera] Video playback paused");
        v.onerror = onError;

        // Fallback: if neither event fires promptly
        const readyTimeout = setTimeout(
          () => {
            if (!isVideoReady) {
              console.warn(
                "[Camera] Using fallback ready detection after timeout"
              );
              markReady();
            }
          },
          isMobile ? 3000 : 2000
        ); // Longer timeout for mobile

        // Cleanup timeout when component unmounts or stream changes
        return () => clearTimeout(readyTimeout);
      }
    } catch (err) {
      let message = "Unable to access camera";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError")
          message = "Camera permission denied";
        else if (err.name === "NotFoundError")
          message = "No camera device found";
        else if (err.name === "NotReadableError")
          message = "Camera is already in use by another application";
        else if (err.name === "OverconstrainedError")
          message = "Requested camera constraints cannot be satisfied";
        else if (err.message) message = err.message;
        // Update availability flags based on the constraint that failed
        if (
          err.name === "NotFoundError" ||
          err.name === "OverconstrainedError"
        ) {
          if (cameraFacing === "environment") setHasBackCamera(false);
          if (cameraFacing === "user") setHasFrontCamera(false);
        }
      }
      setCameraError(message);
      toast({
        title: "Camera error",
        description: message,
        variant: "destructive",
      });
      // Auto-fallback: if back camera unavailable, switch to front and retry
      if (
        err instanceof Error &&
        (err.name === "NotFoundError" || err.name === "OverconstrainedError") &&
        cameraFacing === "environment"
      ) {
        setCameraFacing("user");
        toast({
          title: "Falling back to front camera",
          description: "Rear camera not available. Switched to front camera.",
        });
        setTimeout(() => {
          startCamera();
        }, 0);
      }
    }
  }, [cameraFacing, isVideoReady, stream, toast]);

  const stopCamera = useCallback(() => {
    console.log("[Camera] Stopping camera");

    if (stream) {
      // Log camera session duration
      const sessionDuration =
        performance.now() - perfRef.current.cameraStartTime;
      console.log(
        `[Camera] Session duration: ${(sessionDuration / 1000).toFixed(1)}s`
      );

      // Stop all tracks and clean up
      stream.getTracks().forEach((track) => {
        try {
          console.log(
            `[Camera] Stopping track: ${track.kind} (${
              track.label || "no label"
            })`
          );
          track.stop();
          if (track.readyState === "live") {
            track.enabled = false;
          }
        } catch (err) {
          console.error("[Camera] Error stopping track:", err);
        }
      });

      // Clean up video element
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      setStream(null);

      // Force garbage collection on low-end devices
      if (isLowPerformance && "gc" in window) {
        // @ts-ignore - gc is not in TypeScript's type definitions
        window.gc();
      }
    }

    setIsVideoReady(false);
  }, [stream, isLowPerformance]);
  // Persist camera facing preference
  useEffect(() => {
    try {
      localStorage.setItem("nyambika-camera-facing", cameraFacing);
    } catch {}
  }, [cameraFacing]);

  // Listen for device changes (e.g., plugging in a webcam)
  useEffect(() => {
    const updateFromDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter((d) => d.kind === "videoinput");
        let front = false;
        let back = false;
        for (const d of videos) {
          const lbl = (d.label || "").toLowerCase();
          if (
            lbl.includes("front") ||
            lbl.includes("user") ||
            lbl.includes("webcam") ||
            lbl.includes("face")
          )
            front = true;
          if (
            lbl.includes("back") ||
            lbl.includes("rear") ||
            lbl.includes("environment")
          )
            back = true;
        }
        if (!front && !back) {
          if (videos.length >= 2) {
            front = true;
            back = true;
          } else if (videos.length === 1) {
            front = true;
            back = false;
          }
        }
        setHasFrontCamera(front);
        setHasBackCamera(back);
      } catch {}
    };
    navigator.mediaDevices?.addEventListener?.(
      "devicechange",
      updateFromDevices
    );
    // Also run once when mounted
    updateFromDevices();
    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        updateFromDevices
      );
    };
  }, []);

  const flipCamera = useCallback(() => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
    // Restart the camera to apply the new facing mode
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 0);
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!isVideoReady) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCustomerImage(dataUrl);
    setTryOnResult(null);
    stopCamera();
    toast({ title: "Photo captured", description: "Camera photo saved." });
  }, [isVideoReady, stopCamera, toast]);

  const handleTryOn = useCallback(async () => {
    if (!isAuthenticated) {
      openLoginPrompt();
      return;
    }
    if (!customerImage) {
      toast({
        title: "Missing photo",
        description: "Please upload or capture your photo first.",
      });
      return;
    }
    try {
      setIsProcessingTryOn(true);

      // Convert base64 customer image to Blob
      const personResp = await fetch(customerImage);
      const personBlob = await personResp.blob();

      // Obtain garment image as Blob
      if (!selectedGarmentUrl) {
        throw new Error("Product image is required");
      }
      const garmentResp = await fetch(selectedGarmentUrl);
      const garmentBlob = await garmentResp.blob();

      // Build FormData for server route
      const formData = new FormData();
      formData.append("person_image", personBlob, "person.jpg");
      formData.append("garment_image", garmentBlob, "garment.jpg");
      formData.append("fast_mode", "true");

      // Call JSON-based Next.js API route which integrates with TryOn API per docs
      const res = await fetch("/api/tryon", {
        method: "POST",
        body: formData,
      });

      // 202 => still processing (rare due to server-side polling)
      if (res.status === 202) {
        const j = await res.json();
        toast({
          title: "Still processing",
          description: j.message || "Please wait a bit and retry",
        });
        return;
      }

      const j = await res.json();
      if (!res.ok) {
        throw new Error(
          j?.error || j?.details || `Try-on failed with status ${res.status}`
        );
      }

      // Success path: imageUrl or imageBase64
      let image: string | null = null;
      if (j.imageUrl) {
        image = j.imageUrl as string;
      } else if (j.imageBase64) {
        image = `data:image/png;base64,${j.imageBase64}`;
      }

      if (image) {
        // Revoke old blob URL if any
        setTryOnResult((prev) => {
          if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return image as string;
        });
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1200);
        toast({
          title: "Try-on complete!",
          description: "Your virtual try-on is ready",
        });
      } else {
        toast({
          title: "Completed without image",
          description: "No image payload returned by provider",
        });
      }
    } catch (e) {
      console.error("Try-on error:", e);
      toast({
        title: "Try-on failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingTryOn(false);
    }
  }, [
    customerImage,
    selectedGarmentUrl,
    productId,
    isAuthenticated,
    openLoginPrompt,
    toast,
  ]);

  // UI pieces
  const Header = (
    <motion.div
      className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-3 bg-white dark:bg-slate-900 relative overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* AI Circuit pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            radial-gradient(circle at 20% 50%, #3b82f6 2px, transparent 2px),
            radial-gradient(circle at 80% 50%, #8b5cf6 2px, transparent 2px),
            linear-gradient(90deg, transparent 48%, #06b6d4 50%, transparent 52%)
          `,
            backgroundSize: "40px 20px, 40px 20px, 60px 20px",
          }}
        />
      </div>

      <div className="flex items-center gap-2 relative z-10">
        <Button
          variant="ghost"
          className="px-3 h-9 rounded-full text-slate-700 dark:text-slate-200 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-800 bg-gray-100 dark:bg-gray-800"
          onClick={() => (onBack ? onBack() : router.back())}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <motion.div
          className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-3 h-3 rounded-full bg-white/90" />
        </motion.div>
        <span className="text-sm font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
          AI Try-On Studio
        </span>
        <motion.span
          className="hidden md:inline-block text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          #{productName}
        </motion.span>
      </div>

      <div className="hidden md:flex items-center gap-2 relative z-10">
        <motion.div
          className="flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );

  const Body = (
    <div className="p-0 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="rounded-xl border p-4 sm:p-5 bg-white dark:bg-slate-900 shadow-sm">
        <p className="text-sm font-medium mb-2 sm:mb-3 text-center">
          {productName}
        </p>
        {/* Thumbnails selector */}
        <div className="mt-4 mb-3 flex flex-wrap gap-1 sm:gap-2 items-center justify-center">
          {otherImages &&
            JSON.parse(otherImages.toString()).length > 0 &&
            [
              ...(productImageUrl ? [productImageUrl] : []),
              ...(JSON.parse(otherImages.toString()) || []),
            ]
              .filter((v, i, arr) => v && arr.indexOf(v) === i)
              .map((img) => (
                <button
                  key={img}
                  onClick={() => {
                    setSelectedGarmentUrl(img);
                  }}
                  className={`relative h-10 w-10 sm:h-12 sm:w-12 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-lg overflow-hidden border transition-all ${
                    selectedGarmentUrl === img
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                  }`}
                  title="Choose this image for try-on"
                >
                  <Image
                    src={img}
                    alt="Option"
                    width={96}
                    height={96}
                    sizes="(min-width: 1024px) 48px, (min-width: 768px) 40px, 48px"
                    quality={60}
                    loading="lazy"
                    placeholder="empty"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
        </div>
        {selectedGarmentUrl ? (
          <div className="h-full">
            <motion.div
              key={selectedGarmentUrl}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.02, rotate: 0.2 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-full aspect-square bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden"
            >
              <Image
                src={selectedGarmentUrl}
                alt="Product"
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                quality={70}
                priority={false}
                placeholder="empty"
                className="object-cover"
              />
            </motion.div>
          </div>
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded">
            No product image
          </div>
        )}
      </div>

      <div className="rounded-xl border p-2 sm:p-4 bg-white dark:bg-slate-900 shadow-sm min-h-[480px] sm:min-h-[410px]">
        <p
          className={`text-sm font-medium text-center ${
            stream || customerImage ? "mb-4" : "mb-20 sm:mb-10"
          }`}
        >
          Your Photo
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {stream ? (
          <div
            className={`flex md:fixed items-center justify-center h-[500px] md:h-full inset-0 z-50 bg-black ${
              isVideoReady ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300`}
          >
            <motion.video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              disablePictureInPicture
              disableRemotePlayback
              className={`w-full h-full lg:w-[300px] object-cover bg-black rounded-xl ${
                isLowPerformance ? "transform scale-95" : ""
              }`}
              style={{
                // Optimize for GPU rendering
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                perspective: 1000,
                // Apply will-change only when needed
                willChange: isVideoReady ? "transform, opacity" : "auto",
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{
                opacity: isVideoReady ? 1 : 0,
                scale: isVideoReady ? 1 : 0.98,
              }}
              transition={{
                duration: 0.3,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            />
            {!isVideoReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex items-center gap-3 text-white text-base font-medium">
                  <Loader2 className="h-6 w-6 animate-spin" /> Initializing
                  camera...
                </div>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white p-6 max-w-sm">
                  <div className="text-xl font-semibold mb-3">Camera Error</div>
                  <div className="text-base opacity-90 mb-6">{cameraError}</div>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base"
                    >
                      Retry
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 px-6 py-3 text-base"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Animated corner indicators */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { top: "8px", left: "8px", rotate: 0 },
                { top: "8px", right: "8px", rotate: 90 },
                { bottom: "8px", right: "8px", rotate: 180 },
                { bottom: "8px", left: "8px", rotate: 270 },
              ].map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 border-2 border-sky-400"
                  style={{
                    ...pos,
                    borderBottomColor: "transparent",
                    borderRightColor: "transparent",
                    transform: `rotate(${pos.rotate}deg)`,
                  }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            {/* Close button - top right like real camera apps */}
            <div className="absolute top-6 right-6 z-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 border-0 text-white backdrop-blur-sm p-0"
                >
                  <X className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
            {/* Camera controls - bottom center like real camera apps */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 items-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={capturePhoto}
                  disabled={!isVideoReady}
                  className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-black shadow-2xl border-4 border-white/20 p-0 disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-400"></div>
                  </div>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={flipCamera}
                  variant="ghost"
                  className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 border-0 text-white backdrop-blur-sm p-0"
                  title={
                    (cameraFacing === "user" && !hasBackCamera) ||
                    (cameraFacing === "environment" && !hasFrontCamera)
                      ? "Other camera not available"
                      : "Flip camera"
                  }
                  disabled={
                    (cameraFacing === "user" && !hasBackCamera) ||
                    (cameraFacing === "environment" && !hasFrontCamera)
                  }
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="w-12 h-12"></div> {/* Spacer for symmetry */}
              </motion.div>
            </div>
            {cameraError && (
              <p className="text-xs text-red-500 mt-2 text-center">
                {cameraError}
              </p>
            )}
          </div>
        ) : !customerImage ? (
          <div className="flex flex-col items-center justify-center h-80 sm:h-72 gap-3 sm:gap-4 text-slate-500 px-2">
            {/* Step-by-step SVG Guide */}
            <motion.div
              className="relative w-full max-w-xs sm:max-w-sm h-24 sm:h-28 md:h-32 mb-1 sm:mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg
                viewBox="0 0 200 120"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Step 1: Upload Photo */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  {/* Phone/Camera outline */}
                  <motion.rect
                    x="20"
                    y="20"
                    width="50"
                    height="70"
                    rx="8"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    animate={{
                      strokeDashoffset: [0, -12, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Person silhouette */}
                  <motion.g
                    animate={{
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Head */}
                    <circle
                      cx="45"
                      cy="35"
                      r="8"
                      fill="#8b5cf6"
                      opacity="0.7"
                    />
                    {/* Body */}
                    <rect
                      x="38"
                      y="45"
                      width="14"
                      height="25"
                      rx="7"
                      fill="#8b5cf6"
                      opacity="0.7"
                    />
                    {/* Arms */}
                    <rect
                      x="30"
                      y="48"
                      width="8"
                      height="3"
                      rx="1.5"
                      fill="#8b5cf6"
                      opacity="0.7"
                    />
                    <rect
                      x="52"
                      y="48"
                      width="8"
                      height="3"
                      rx="1.5"
                      fill="#8b5cf6"
                      opacity="0.7"
                    />
                    {/* Legs */}
                    <rect
                      x="40"
                      y="70"
                      width="4"
                      height="12"
                      rx="2"
                      fill="#8b5cf6"
                      opacity="0.7"
                    />
                    <rect
                      x="46"
                      y="70"
                      width="4"
                      height="12"
                      rx="2"
                      fill="#8b5cf6"
                      opacity="0.7"
                    />
                  </motion.g>
                </motion.g>

                {/* Arrow */}
                <motion.g
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <motion.path
                    d="M 80 55 L 95 55 M 90 50 L 95 55 L 90 60"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    animate={{
                      x: [0, 5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.g>

                {/* Step 2: AI Processing */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  {/* AI Brain */}
                  <motion.circle
                    cx="120"
                    cy="40"
                    r="15"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Neural connections */}
                  {[0, 1, 2].map((i) => (
                    <motion.circle
                      key={i}
                      cx={115 + i * 5}
                      cy={35 + i * 3}
                      r="2"
                      fill="#06b6d4"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}

                  {/* Processing text */}
                  <motion.text
                    x="120"
                    y="65"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#6366f1"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  >
                    AI Magic
                  </motion.text>
                </motion.g>

                {/* Arrow 2 */}
                <motion.g
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                >
                  <motion.path
                    d="M 145 55 L 160 55 M 155 50 L 160 55 L 155 60"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    animate={{
                      x: [0, 5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                </motion.g>

                {/* Step 3: Result */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.8 }}
                >
                  {/* Result frame */}
                  <motion.rect
                    x="170"
                    y="25"
                    width="25"
                    height="35"
                    rx="3"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(139, 92, 246, 0)",
                        "0 0 0 4px rgba(139, 92, 246, 0.3)",
                        "0 0 0 0 rgba(139, 92, 246, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />

                  {/* Sparkles */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.g key={i}>
                      <motion.path
                        d={`M ${175 + (i % 2) * 10} ${
                          30 + Math.floor(i / 2) * 15
                        } l 2 0 l -1 -2 l -1 2 l 0 2 l 1 -1 l 1 1 z`}
                        fill="#fbbf24"
                        animate={{
                          scale: [0, 1, 0],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    </motion.g>
                  ))}
                </motion.g>

                {/* Step indicators */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                >
                  <text
                    x="45"
                    y="105"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#3b82f6"
                    fontWeight="600"
                  >
                    1
                  </text>
                  <text
                    x="120"
                    y="105"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#3b82f6"
                    fontWeight="600"
                  >
                    2
                  </text>
                  <text
                    x="182"
                    y="105"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#3b82f6"
                    fontWeight="600"
                  >
                    3
                  </text>

                  <text
                    x="45"
                    y="115"
                    textAnchor="middle"
                    fontSize="6"
                    fill="#64748b"
                  >
                    Upload
                  </text>
                  <text
                    x="120"
                    y="115"
                    textAnchor="middle"
                    fontSize="6"
                    fill="#64748b"
                  >
                    Process
                  </text>
                  <text
                    x="182"
                    y="115"
                    textAnchor="middle"
                    fontSize="6"
                    fill="#64748b"
                  >
                    Result
                  </text>
                </motion.g>
              </svg>
            </motion.div>

            {/* Instructions */}
            <motion.div
              className="text-center space-y-2 px-4 sm:px-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                Take a full-body photo
                <br />
                <span className="text-sm">For best results</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Stand straight, arms slightly away from body, good lighting
              </p>
            </motion.div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-center mt-6 px-4 sm:px-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.4 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 text-base sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 shadow-lg hover:shadow-xl shadow-blue-500/25 dark:shadow-blue-400/30 dark:hover:shadow-blue-400/40 touch-manipulation rounded-full border-0 text-white transition-all duration-200"
                >
                  <Upload className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
                  <span className="sm:hidden">Choose Photo from Gallery</span>
                  <span className="hidden sm:inline">Upload</span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.4 }}
                className="w-full sm:w-auto hidden md:inline-block"
              >
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 text-base sm:text-sm font-semibold border-2 border-blue-300 hover:border-blue-400 bg-white/95 hover:bg-blue-50 dark:bg-slate-800/95 dark:hover:bg-slate-700/95 dark:border-blue-500 dark:hover:border-blue-400 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 shadow-md hover:shadow-lg dark:shadow-slate-900/20 dark:hover:shadow-slate-900/30 backdrop-blur-sm touch-manipulation rounded-full transition-all duration-200"
                >
                  <Camera className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
                  <span className="sm:hidden">Take Photo with Camera</span>
                  <span className="hidden sm:inline">Camera</span>
                </Button>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <motion.img
              src={customerImage}
              alt="Customer"
              className="w-full min-h-full object-cover bg-slate-50 dark:bg-slate-800 rounded-lg"
              initial={{ opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 280, damping: 25 }}
            />
            <Button
              aria-label="Remove photo"
              variant="ghost"
              className="absolute top-2 right-2 h-10 w-10 sm:h-9 sm:w-9 p-0 rounded-full bg-red-500/10 hover:bg-red-500/20 dark:bg-red-400/10 dark:hover:bg-red-400/20 backdrop-blur-sm border border-red-200/50 dark:border-red-400/30 touch-manipulation"
              onClick={clearAll}
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="rounded-xl relative border p-2 sm:p-4 bg-white dark:bg-slate-900 shadow-sm min-h-[360px] sm:min-h-[320px] overflow-hidden">
        <p className="text-sm font-medium mb-3 sm:mb-4 text-center">Result</p>
        <AnimatePresence mode="wait">
          {isProcessingTryOn ? (
            <motion.div
              key="result"
              className="relative h-80 sm:h-72 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* AI Scan line animation */}
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent"
                initial={{ y: 0, opacity: 0.8 }}
                animate={{ y: 256, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              />
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                    linear-gradient(rgba(96, 165, 250, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(96, 165, 250, 0.3) 1px, transparent 1px)
                  `,
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
              <div className="relative z-10 flex flex-row items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />{" "}
                <div>Processing...</div>
              </div>
            </motion.div>
          ) : tryOnResult ? (
            <div className="relative overflow-hidden rounded">
              <motion.img
                key={tryOnResult}
                src={tryOnResult}
                alt="Try-on result"
                className="w-full min-h-full object-cover"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                whileHover={{ scale: 1.02 }}
              />
              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 3,
                  delay: 0.5,
                }}
              />
            </div>
          ) : (
            <motion.div
              key="placeholder"
              className="h-64 flex flex-col items-center justify-center gap-4 text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Waiting for result SVG */}
              <motion.div
                className="w-32 h-24"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <svg
                  viewBox="0 0 120 80"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Magic wand */}
                  <motion.g
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ transformOrigin: "60px 40px" }}
                  >
                    {/* Wand handle */}
                    <rect
                      x="45"
                      y="35"
                      width="30"
                      height="4"
                      rx="2"
                      fill="#8b5cf6"
                    />
                    {/* Wand tip */}
                    <circle cx="77" cy="37" r="3" fill="#fbbf24" />

                    {/* Magic sparkles */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.g key={i}>
                        <motion.path
                          d={`M ${80 + (i % 3) * 8} ${
                            25 + Math.floor(i / 3) * 12
                          } l 1.5 0 l -0.75 -1.5 l -0.75 1.5 l 0 1.5 l 0.75 -0.75 l 0.75 0.75 z`}
                          fill="#fbbf24"
                          animate={{
                            scale: [0, 1.2, 0],
                            rotate: [0, 180, 360],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                        />
                      </motion.g>
                    ))}
                  </motion.g>

                  {/* Placeholder frame */}
                  <motion.rect
                    x="20"
                    y="15"
                    width="35"
                    height="50"
                    rx="4"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="5,3"
                    animate={{
                      strokeDashoffset: [0, -16, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Question mark in frame */}
                  <motion.text
                    x="37.5"
                    y="45"
                    textAnchor="middle"
                    fontSize="20"
                    fill="#94a3b8"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    ?
                  </motion.text>
                </svg>
              </motion.div>

              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Ready for AI magic!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Upload your photo to see the try-on result
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Celebration burst overlay */}
        <AnimatePresence>
          {celebrate && (
            <motion.div
              key="celebrate"
              className="pointer-events-none absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative w-full h-full">
                {[
                  "#3b82f6",
                  "#8b5cf6",
                  "#06b6d4",
                  "#6366f1",
                  "#0ea5e9",
                  "#7c3aed",
                ].map((c, i) => (
                  <motion.span
                    key={i}
                    className="absolute block rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${c}, ${c}aa)`,
                      width: i % 2 === 0 ? 10 : 8,
                      height: i % 2 === 0 ? 10 : 8,
                      left: `${15 + i * 12}%`,
                      top: `${45 + (i % 2 === 0 ? -8 : 8)}%`,
                      boxShadow: `0 0 15px ${c}88, 0 0 25px ${c}44`,
                    }}
                    initial={{ scale: 0, opacity: 1, y: 0, rotate: 0 }}
                    animate={{
                      scale: [0, 2, 0],
                      opacity: [1, 0.8, 0],
                      y: i % 2 === 0 ? -50 : -35,
                      x: (i - 2.5) * 15,
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.2,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: i * 0.08,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Try-On Button moved here - Fixed to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          {!tryOnResult && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              animate={
                customerImage && !isProcessingTryOn
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(59, 130, 246, 0)",
                        "0 0 0 8px rgba(59, 130, 246, 0.15)",
                        "0 0 0 0 rgba(59, 130, 246, 0)",
                      ],
                    }
                  : {}
              }
              transition={{
                boxShadow: { duration: 2, repeat: Infinity },
              }}
              className="w-full rounded-full"
            >
              <Button
                onClick={handleTryOn}
                disabled={!customerImage || isProcessingTryOn}
                className={`w-full min-h-[52px] px-6 py-4 text-base sm:text-sm font-semibold touch-manipulation rounded-full transition-all duration-200 ${
                  customerImage && !isProcessingTryOn
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:via-indigo-700 dark:hover:to-purple-700 shadow-lg hover:shadow-xl shadow-blue-500/25 dark:shadow-blue-400/30 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {isProcessingTryOn ? (
                  <>
                    <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2 animate-spin" />
                    <span className="sm:hidden">Generating AI Try-On...</span>
                    <span className="hidden sm:inline">Generating</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 sm:h-4 sm:w-4 mr-3 sm:mr-2" />
                    <span className="sm:hidden">Generate AI Try-On</span>
                    <span className="hidden sm:inline">Generate Try-On</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}
          {tryOnResult && (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <Button
                  onClick={clearAll}
                  variant="outline"
                  className="px-5 py-3 text-sm touch-manipulation rounded-full w-full"
                >
                  Reset & Try Again
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <Button
                  onClick={() => {
                    if (onNavigateToProduct) {
                      onNavigateToProduct(productId);
                    } else {
                      // Fallback navigation to product details
                      window.open(`/products/${productId}`, "_blank");
                    }
                  }}
                  variant="outline"
                  className="px-5 py-3 cursor-pointer text-sm touch-manipulation rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg w-full"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" /> Send Order
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const widgetContent = (
    <div className="relative pb-10 md:pb-4 -mx-2 md:mx-0">
      {/* AI Neural Network Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-70"
            style={{
              background: [
                "linear-gradient(135deg, #0ea5e9, #3b82f6)", // AI Blue
                "linear-gradient(135deg, #8b5cf6, #a855f7)", // Neural Purple
                "linear-gradient(135deg, #06b6d4, #0891b2)", // Cyan Data
                "linear-gradient(135deg, #6366f1, #8b5cf6)", // Indigo AI
                "linear-gradient(135deg, #0284c7, #0369a1)", // Deep Blue
                "linear-gradient(135deg, #7c3aed, #6d28d9)", // Deep Purple
              ][i % 6],
              width: i % 3 === 0 ? "6px" : "4px",
              height: i % 3 === 0 ? "6px" : "4px",
              left: `${5 + ((i * 8) % 90)}%`,
              top: `${10 + ((i * 12) % 80)}%`,
              boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)",
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, -10, 0],
              scale: [1, 1.4, 0.6, 1],
              opacity: [0.7, 1, 0.3, 0.7],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Neural connection lines */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent, #3b82f6, transparent)",
              width: "120px",
              left: `${20 + i * 20}%`,
              top: `${30 + i * 15}%`,
              transformOrigin: "left center",
            }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      {/* Animated gradient background with parallax */}
      <motion.div
        className="absolute inset-0 -z-10 blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, #3b82f6 0%, #8b5cf6 30%, #06b6d4 60%, transparent 100%)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 2, 0],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="rounded-xl sm:rounded-2xl sm:dark:p-0.5"
        style={{
          background:
            "linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4, #6366f1)",
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-slate-900/95 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50">
          {Header}
          {Body}
        </div>
      </motion.div>
    </div>
  );

  return widgetContent;
}
