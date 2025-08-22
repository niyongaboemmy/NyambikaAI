import { Link } from 'wouter';
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const quickLinks = [
    { href: '/', label: 'Ahabanza' },
    { href: '/products', label: 'Imyenda' },
    { href: '/try-on', label: 'AI Try-On' },
    { href: '/profile', label: 'Abo turi' },
  ];

  const supportLinks = [
    { href: '/help', label: 'Help Center' },
    { href: '/size-guide', label: 'Size Guide' },
    { href: '/returns', label: 'Returns' },
    { href: '/contact', label: 'Contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', color: 'hover:text-blue-500' },
    { icon: Twitter, href: '#', color: 'hover:text-sky-500' },
    { icon: Instagram, href: '#', color: 'hover:text-pink-500' },
    { icon: Linkedin, href: '#', color: 'hover:text-blue-600' },
  ];

  return (
    <footer className="py-20 px-4 md:px-6 bg-gradient-to-br from-gray-900 to-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                <span className="text-white text-xl font-bold">N</span>
              </div>
              <span className="text-3xl font-bold text-white">Nyambika</span>
            </div>
            <p className="text-gray-400 text-lg">
              AI-powered fashion platform<br/>
              for Rwanda's clothing sector
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    className={`glassmorphism rounded-lg p-3 hover:scale-105 transition-all duration-300 text-white ${social.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Quick Links</h3>
            <div className="space-y-3">
              {quickLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Support</h3>
            <div className="space-y-3">
              {supportLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Contact</h3>
            <div className="space-y-3">
              <p className="text-gray-400 flex items-center">
                <Phone className="mr-3 h-4 w-4" />
                +250 788 123 456
              </p>
              <p className="text-gray-400 flex items-center">
                <Mail className="mr-3 h-4 w-4" />
                info@nyambika.rw
              </p>
              <p className="text-gray-400 flex items-center">
                <MapPin className="mr-3 h-4 w-4" />
                Kigali, Rwanda
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Nyambika. All rights reserved. Made with ❤️ in Rwanda
          </p>
        </div>
      </div>
    </footer>
  );
}
