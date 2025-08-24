import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/try-on", label: "AI Try-On" },
    { href: "/profile", label: "Profile" },
  ];

  const supportLinks = [
    { href: "/help", label: "Help Center" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/returns", label: "Returns" },
    { href: "/contact", label: "Contact" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-500" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-500" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-500" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-600" },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 to-slate-900 mt-16">
      {/* subtle top border glow */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container mx-auto px-3 md:px-0 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                <span className="text-white text-xl font-bold">N</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                Nyambika
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              AI-powered fashion platform for Rwanda's clothing sector. Discover, try-on, and shop from local producers.
            </p>
            <div className="flex items-center gap-2.5">
              {socialLinks.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Button
                    key={i}
                    asChild
                    variant="ghost"
                    size="icon"
                    className={`rounded-lg p-2.5 text-gray-300 hover:text-white hover:bg-white/10 transition ${s.color}`}
                    aria-label={s.label}
                  >
                    <a href={s.href} target="_blank" rel="noreferrer noopener">
                      <Icon className="h-5 w-5" />
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider mb-5 uppercase">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider mb-5 uppercase">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider mb-5 uppercase">Stay Updated</h3>
            <p className="text-gray-400 mb-4">Subscribe to get new arrivals, updates and special offers.</p>
            <form
              className="flex w-full items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: hook to backend/newsletter provider
              }}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 text-white placeholder:text-gray-400 border-white/10"
                required
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                Subscribe
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-gray-400">
              <div className="flex items-center">
                <Phone className="mr-3 h-4 w-4" /> +250 788 123 456
              </div>
              <div className="flex items-center">
                <Mail className="mr-3 h-4 w-4" /> info@nyambika.rw
              </div>
              <div className="flex items-center">
                <MapPin className="mr-3 h-4 w-4" /> Kigali, Rwanda
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400">
          <p>© {year} Nyambika. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
