import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Download, Share2, RotateCcw, Zap } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TryOn() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [product, setProduct] = useState<any | null>(null);

  // Helper: compress image to ~<2MB using canvas resize and JPEG quality
  const compressDataUrl = async (dataUrl: string) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const targetBytes = 2 * 1024 * 1024; // ~2MB
    let quality = 0.85;
    let maxDim = 1400;
    let output = dataUrl;

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
      if (!ctx) break;
      ctx.drawImage(img, 0, 0, width, height);

      output = canvas.toDataURL("image/jpeg", quality);
      const approxBytes = Math.ceil(
        ((output.length - "data:image/jpeg;base64,".length) * 3) / 4
      );
      if (approxBytes <= targetBytes) break;

      quality = Math.max(0.6, quality - 0.1);
      maxDim = Math.max(800, Math.round(maxDim * 0.85));
    }

    return output;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // Export with initial quality then compress further
        const rawUrl = canvas.toDataURL("image/jpeg", 0.9);
        const compressed = await compressDataUrl(rawUrl);
        setSelectedImage(compressed);
        stopCamera();
      }
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const compressed = await compressDataUrl(dataUrl);
    setSelectedImage(compressed);
  };

  const processImage = async () => {
    if (!selectedImage || !selectedProductId) return;

    setIsProcessing(true);

    try {
      // Convert base64 to blob and back to clean base64
      const base64Data = selectedImage.split(",")[1];

      // Create try-on session
      const token = localStorage.getItem("auth_token");
      const sessionResponse = await fetch("/api/try-on-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerImageUrl: selectedImage,
          productId: selectedProductId,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create try-on session");
      }

      const session = await sessionResponse.json();

      // Process the try-on with AI
      const processResponse = await fetch(
        `/api/try-on-sessions/${session.id}/process`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (processResponse.ok) {
        const result = await processResponse.json();
        if (result.tryOnImageUrl) {
          setProcessedImage(result.tryOnImageUrl);
        } else {
          // Fallback to original image if AI processing fails
          setProcessedImage(selectedImage);
        }
      } else {
        // Fallback processing
        setProcessedImage(selectedImage);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      // Fallback to original image
      setProcessedImage(selectedImage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSession = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    stopCamera();
  };

  // Initialize selected product from URL (?productId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("productId");
    if (pid) setSelectedProductId(pid);
  }, []);

  // Fetch selected product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!selectedProductId) return;
      try {
        const res = await fetch(`/api/products/${selectedProductId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setProduct(null);
        }
      } catch (e) {
        console.error("Failed to load product:", e);
        setProduct(null);
      }
    };
    fetchProduct();
  }, [selectedProductId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              AI Try-On Studio
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Reba uko imyenda ikubana mbere yo kugura / See how clothes look on
              you before buying
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Photo Input Section */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="floating-card p-8">
                <CardContent className="p-0">
                  <h2 className="text-2xl font-bold gradient-text mb-6">
                    Shyira Ifoto Yawe / Upload Your Photo
                  </h2>

                  {!selectedImage && !isCameraActive && (
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex flex-col items-center justify-center space-y-6">
                      <div className="text-center space-y-4">
                        <Zap className="h-16 w-16 text-gray-400 mx-auto" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Take a photo or upload an image to get started
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={startCamera}
                          className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          <Camera className="mr-2 h-5 w-5" />
                          Fata Ifoto / Take Photo
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="ghost"
                          className="glassmorphism px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          <Upload className="mr-2 h-5 w-5" />
                          Shyiramo Ifoto / Upload
                        </Button>
                      </div>
                    </div>
                  )}

                  {isCameraActive && (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full aspect-[3/4] object-cover rounded-2xl"
                      />
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={capturePhoto}
                          className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          <Camera className="mr-2 h-5 w-5" />
                          Capture
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="ghost"
                          className="glassmorphism px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedImage && !isProcessing && !processedImage && (
                    <div className="space-y-6">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full aspect-[3/4] object-cover rounded-2xl"
                      />
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={processImage}
                          disabled={isProcessing}
                          className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100"
                        >
                          <Zap className="mr-2 h-5 w-5" />
                          {isProcessing ? "Processing..." : "Process with AI"}
                        </Button>
                        <Button
                          onClick={resetSession}
                          variant="ghost"
                          className="glassmorphism px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Start Over
                        </Button>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      <img
                        src={selectedImage!}
                        alt="Processing"
                        className="w-full h-full object-cover rounded-2xl opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="glassmorphism rounded-xl p-6 text-center">
                          <div className="animate-spin h-8 w-8 border-2 border-[rgb(var(--electric-blue-rgb))] border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-gray-700 dark:text-gray-300 font-semibold">
                            AI Processing with OpenAI...
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Analyzing fit and generating virtual try-on
                          </p>
                          <div className="w-32 bg-gray-300 dark:bg-gray-600 rounded-full h-2 mt-4">
                            <div
                              className="gradient-bg h-2 rounded-full animate-pulse"
                              style={{ width: "65%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {processedImage && (
                    <div className="space-y-6">
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="w-full aspect-[3/4] object-cover rounded-2xl"
                      />
                      <div className="flex justify-center gap-4">
                        <Button className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300">
                          <Download className="mr-2 h-5 w-5" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          className="glassmorphism px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          <Share2 className="mr-2 h-5 w-5" />
                          Share
                        </Button>
                        <Button
                          onClick={resetSession}
                          variant="ghost"
                          className="glassmorphism px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Try Another
                        </Button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Product Sidebar (selected item) */}
            <div className="space-y-8">
              <Card className="floating-card p-6">
                <CardContent className="p-0">
                  <h3 className="text-xl font-bold gradient-text mb-4">
                    Selected Product
                  </h3>
                  {!selectedProductId && (
                    <div className="glassmorphism rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300">
                      No product selected. Please start from Try-On product
                      selection.
                      <div className="mt-3">
                        <a href="/try-on-start" className="underline">
                          Go to Try-On selection
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedProductId && (
                    <div className="glassmorphism rounded-xl p-4 border border-transparent">
                      {product ? (
                        <>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <p className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                            {product.name}
                          </p>
                          {product.nameRw && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {product.nameRw}
                            </p>
                          )}
                          <div className="mt-4">
                            <Button asChild className="w-full gradient-bg text-white">
                              <a href={`/product/${selectedProductId}`}>Continue to Product</a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Loading product...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="floating-card p-6">
                <CardContent className="p-0">
                  <h3 className="text-xl font-bold gradient-text mb-4">
                    AI Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Real-time processing
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Accurate fit visualization
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Easy sharing options
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
