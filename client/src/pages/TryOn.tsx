import { useState, useRef } from 'react';
import { Camera, Upload, Download, Share2, RotateCcw, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function TryOn() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const sampleProducts = [
    {
      id: '1',
      name: 'Summer Dress',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    },
    {
      id: '2',
      name: 'Casual Shirt',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    },
    {
      id: '3',
      name: 'Evening Gown',
      image: 'https://images.unsplash.com/photo-1566479179817-c0e22ca41a80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400'
    },
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    
    try {
      // Convert base64 to blob and back to clean base64
      const base64Data = selectedImage.split(',')[1];
      
      // Create try-on session
      const sessionResponse = await fetch('/api/try-on-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-1' // Demo authentication
        },
        body: JSON.stringify({
          customerImageUrl: selectedImage,
          productId: sampleProducts[0].id, // Use first product for demo
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create try-on session');
      }

      const session = await sessionResponse.json();

      // Process the try-on with AI
      const processResponse = await fetch(`/api/try-on-sessions/${session.id}/process`, {
        method: 'POST',
        headers: {
          'x-user-id': 'demo-user-1'
        }
      });

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
      console.error('Error processing image:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <Header />
      
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
              AI Try-On Studio
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Reba uko imyenda ikubana mbere yo kugura / See how clothes look on you before buying
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
                          {isProcessing ? 'Processing...' : 'Process with AI'}
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
                            <div className="gradient-bg h-2 rounded-full animate-pulse" style={{ width: '65%' }}></div>
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
                        <Button 
                          className="gradient-bg text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300"
                        >
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

            {/* Product Selection Sidebar */}
            <div className="space-y-8">
              <Card className="floating-card p-6">
                <CardContent className="p-0">
                  <h3 className="text-xl font-bold gradient-text mb-4">
                    Hitamo Igicuruzwa / Select Product
                  </h3>
                  <div className="space-y-4">
                    {sampleProducts.map((product) => (
                      <div key={product.id} className="glassmorphism rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {product.name}
                        </p>
                      </div>
                    ))}
                  </div>
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
