import { Link } from "wouter";
import React from "react";
import { toast } from "@/hooks/use-toast";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showTop, setShowTop] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    {
      icon: Facebook,
      href: "#",
      label: "Facebook",
      color: "hover:text-blue-500",
    },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-500" },
    {
      icon: Instagram,
      href: "#",
      label: "Instagram",
      color: "hover:text-pink-500",
    },
    {
      icon: Linkedin,
      href: "#",
      label: "LinkedIn",
      color: "hover:text-blue-600",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 mt-16">
      {/* subtle top border glow */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* AI-inspired animated gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-blue-500/60 to-purple-600/60 animate-pulse" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-indigo-500/50 to-cyan-500/50 animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full blur-2xl opacity-10 bg-gradient-to-br from-fuchsia-500/50 to-emerald-500/40" />
      </div>

      {/* subtle noise overlay for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-20"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8, %3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E')",
        }}
      />

      {/* AI CTA banner */}
      <div className="container mx-auto px-3 md:px-0 pt-12">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-fuchsia-500/10 to-cyan-500/10" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 md:p-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white ring-1 ring-white/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live AI
                </span>
                <span className="text-xs text-gray-300">
                  Try outfits virtually
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Experience AI Try‑On for Your Next Look
              </h2>
              <p className="mt-2 text-gray-300 max-w-2xl">
                Upload your photo, get instant smart fits, and shop confidently
                with Nyambika’s AI.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20"
              >
                <Link href="/try-on">Start AI Try‑On</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-0 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
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
            <p className="text-gray-400 leading-relaxed text-sm">
              AI-powered fashion platform for Rwanda's clothing sector.
              Discover, try-on, and shop from local producers.
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

          {/* Removed non-essential link lists to keep footer concise */}

          {/* Newsletter */}
          <div className="text-sm">
            <h3 className="text-sm font-semibold text-white tracking-wider mb-5 uppercase">
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-4">
              Subscribe to get new arrivals, updates and special offers.
            </p>
            <form
              className="flex w-full items-center gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
                if (!emailRegex.test(email)) {
                  toast?.({
                    title: "Invalid email",
                    description: "Please enter a valid email address.",
                    variant: "destructive",
                  });
                  return;
                }
                try {
                  setSubmitting(true);
                  // TODO: Replace with real endpoint
                  await new Promise((r) => setTimeout(r, 800));
                  toast?.({
                    title: "Subscribed",
                    description: "Thanks for joining our newsletter!",
                  });
                  setEmail("");
                } catch (err) {
                  toast?.({
                    title: "Subscription failed",
                    description: "Please try again later.",
                    variant: "destructive",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white/10 text-white placeholder:text-gray-400 border-white/10"
                required
                aria-label="Email address"
              />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500"
                disabled={submitting}
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-gray-400">
              <div className="flex items-center">
                <Phone className="mr-3 h-4 w-4" /> +250 782 634 364
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
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-40 rounded-full p-3 shadow-lg transition-all bg-blue-600 hover:bg-blue-500 text-white ${
          showTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </footer>
  );
}
