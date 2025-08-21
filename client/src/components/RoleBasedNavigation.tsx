import { useState } from 'react';
import { Link } from 'wouter';
import { useTheme } from '@/hooks/useTheme';
import { 
  ShoppingBag, 
  User, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Plus, 
  BarChart3, 
  Package, 
  Settings,
  Users,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleBasedNavigationProps {
  userRole: 'customer' | 'producer' | 'admin';
  userName?: string;
}

export default function RoleBasedNavigation({ userRole, userName }: RoleBasedNavigationProps) {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState('rw');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getNavLinks = () => {
    switch (userRole) {
      case 'customer':
        return [
          { href: '/', label: 'Ahabanza', en: 'Home' },
          { href: '/products', label: 'Imyenda', en: 'Products' },
          { href: '/try-on', label: 'Gerageza', en: 'Try-On' },
          { href: '/profile', label: 'Profil', en: 'Profile' },
        ];
      case 'producer':
        return [
          { href: '/producer-dashboard', label: 'Dashboard', en: 'Dashboard' },
          { href: '/producer-products', label: 'Imyenda Yanjye', en: 'My Products' },
          { href: '/producer-orders', label: 'Ama Order', en: 'Orders' },
          { href: '/producer-analytics', label: 'Imibare', en: 'Analytics' },
        ];
      case 'admin':
        return [
          { href: '/admin-dashboard', label: 'Dashboard', en: 'Dashboard' },
          { href: '/admin-users', label: 'Abakoresha', en: 'Users' },
          { href: '/admin-products', label: 'Ibicuruzwa', en: 'Products' },
          { href: '/admin-orders', label: 'Ama Order', en: 'Orders' },
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case 'customer':
        return (
          <>
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative clean-button hover:scale-105 transition-all duration-300"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="clean-button hover:scale-105 transition-all duration-300"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </>
        );
      case 'producer':
        return (
          <>
            <Link href="/producer-products/new">
              <Button
                variant="ghost"
                size="icon"
                className="clean-button hover:scale-105 transition-all duration-300"
                title="Add Product"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/producer-orders">
              <Button
                variant="ghost"
                size="icon"
                className="relative clean-button hover:scale-105 transition-all duration-300"
              >
                <Package className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  5
                </span>
              </Button>
            </Link>
            <Link href="/producer-analytics">
              <Button
                variant="ghost"
                size="icon"
                className="clean-button hover:scale-105 transition-all duration-300"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>
          </>
        );
      case 'admin':
        return (
          <>
            <Link href="/admin-products">
              <Button
                variant="ghost"
                size="icon"
                className="relative clean-button hover:scale-105 transition-all duration-300"
                title="Pending Approvals"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  12
                </span>
              </Button>
            </Link>
            <Link href="/admin-users">
              <Button
                variant="ghost"
                size="icon"
                className="clean-button hover:scale-105 transition-all duration-300"
              >
                <Users className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin-settings">
              <Button
                variant="ghost"
                size="icon"
                className="clean-button hover:scale-105 transition-all duration-300"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6">
      <nav className="glassmorphism rounded-2xl px-4 py-3 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <span className="text-white text-lg font-bold">N</span>
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">Nyambika</span>
              {userRole !== 'customer' && (
                <div className="text-xs text-muted-foreground capitalize">
                  {userRole} Portal
                </div>
              )}
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
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
              className="clean-input text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
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
              className="clean-button hover:scale-105 transition-all duration-300"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            {/* Role-based Quick Actions */}
            {getQuickActions()}

            {/* User Name (for authenticated users) */}
            {userName && (
              <div className="hidden md:block text-sm text-muted-foreground">
                Welcome, {userName}
              </div>
            )}

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
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-foreground hover:text-primary transition-colors font-medium"
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