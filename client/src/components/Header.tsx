import { useState } from 'react';
import { Link } from 'wouter';
import { useTheme } from '@/hooks/useTheme';
import { ShoppingBag, User, Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState('rw');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { href: '/', label: 'Ahabanza', en: 'Home' },
    { href: '/products', label: 'Imyenda', en: 'Products' },
    { href: '/try-on', label: 'Gerageza', en: 'Try-On' },
    { href: '/profile', label: 'Profil', en: 'Profile' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6">
      <nav className="glassmorphism rounded-2xl px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-white text-lg font-bold">N</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Nyambika</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 dark:text-gray-300 hover:text-[rgb(var(--electric-blue-rgb))] transition-colors"
              >
                {language === 'rw' ? link.label : link.en}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="glassmorphism rounded-lg px-3 py-2 text-sm bg-transparent border-0 focus:ring-2 focus:ring-[rgb(var(--electric-blue-rgb))]"
            >
              <option value="rw">🇷🇼 Kinyarwanda</option>
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </Button>
            
            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <ShoppingBag className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 bg-[rgb(var(--coral-rgb))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </Link>
            
            {/* Profile */}
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="glassmorphism rounded-lg hover:scale-105 transition-all duration-300"
              >
                <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-gray-700 dark:text-gray-300 hover:text-[rgb(var(--electric-blue-rgb))] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {language === 'rw' ? link.label : link.en}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
