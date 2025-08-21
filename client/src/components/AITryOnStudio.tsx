import { useState } from 'react';
import { Camera, Upload, Sparkles, Ruler, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AITryOnStudio() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTakePhoto = () => {
    setIsProcessing(true);
    // TODO: Implement camera functionality
    setTimeout(() => setIsProcessing(false), 3000);
  };

  const handleUploadPhoto = () => {
    setIsProcessing(true);
    // TODO: Implement file upload functionality
    setTimeout(() => setIsProcessing(false), 3000);
  };

  const features = [
    {
      icon: Sparkles,
      title: "Ubusobanuro bw'AI",
      description: "Advanced AI technology provides realistic clothing visualization on your body"
    },
    {
      icon: Ruler,
      title: "Ibipimo by'Ukuri",
      description: "Get accurate size recommendations based on your measurements and body type"
    },
    {
      icon: Clock,
      title: "Byihuse Cyane",
      description: "Real-time processing provides instant results in just a few seconds"
    }
  ];

  return (
    <section id="tryon" className="py-20 px-4 md:px-6 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            AI Try-On Studio
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Koresha tekinoloji ya AI kugira ngo urebe uko imyenda ikubana mbere yo kugura
            <span className="block text-lg mt-2">Use AI technology to see how clothes look on you before buying</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Try-On Interface */}
          <div className="glassmorphism rounded-3xl p-8 neumorphism">
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000"
                alt="AI Try-On Preview"
                className="w-full h-full object-cover rounded-2xl"
              />
              {isProcessing && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="glassmorphism rounded-xl p-3">
                      <p className="text-white text-sm">AI Processing...</p>
                      <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                        <div className="bg-[rgb(var(--coral-rgb))] h-1 rounded-full animate-pulse w-16"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleTakePhoto}
                disabled={isProcessing}
                className="w-full gradient-bg text-white py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                <Camera className="mr-3 h-5 w-5" />
                Fata Ifoto / Take Photo
              </Button>
              <Button 
                onClick={handleUploadPhoto}
                disabled={isProcessing}
                variant="ghost"
                className="w-full glassmorphism text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                <Upload className="mr-3 h-5 w-5" />
                Shyiramo Ifoto / Upload Photo
              </Button>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
