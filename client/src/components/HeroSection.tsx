import { useState } from 'react';
import { Search, Camera, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-20 px-4 md:px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--electric-blue-rgb)/0.2)] via-[rgb(var(--coral-rgb)/0.1)] to-purple-500/20 animate-gradient-x"></div>
      </div>
      
      <div className="text-center max-w-4xl mx-auto">
        <div className="animate-float">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            Imyenda nziza
            <br />
            <span className="text-4xl md:text-6xl">n'ubwiza bw'AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Gukoresha tekinoloji ya AI kugira ngo ubona imyenda ikwiriye
            <br />
            <span className="text-lg md:text-xl opacity-75">AI-powered fashion platform for Rwanda</span>
          </p>
        </div>

        {/* Search Bar */}
        <div className="glassmorphism rounded-2xl p-2 max-w-2xl mx-auto mb-12 hover:scale-105 transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Shakisha imyenda ushaka... (Search for clothes...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-transparent rounded-xl border-0 focus:ring-0 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="gradient-bg text-white px-8 py-4 rounded-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Search className="mr-2 h-4 w-4" />
              Shakisha
            </Button>
          </div>
        </div>

        {/* AI Try-On CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            className="gradient-bg text-white px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg neumorphism"
            size="lg"
          >
            <Camera className="mr-3 h-5 w-5" />
            Gerageza AI Try-On
          </Button>
          <Button 
            variant="ghost"
            className="glassmorphism text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
            size="lg"
          >
            <Play className="mr-3 h-5 w-5" />
            Reba Video
          </Button>
        </div>
      </div>
    </section>
  );
}
