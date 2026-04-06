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
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { Input } from "@/components/custom-ui/input";
import { Separator } from "@/components/custom-ui/separator";
import Link from "next/link";
import { apiClient, API_ENDPOINTS, handleApiError } from "@/config/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showTop, setShowTop] = React.useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const legalLinks = [
    { href: "/about", label: t("footer.link.about") },
    { href: "/contact", label: t("footer.link.contact") },
    { href: "/privacy", label: t("footer.link.privacy") },
    { href: "/terms", label: t("footer.link.terms") },
    { href: "/cookies", label: t("footer.link.cookies") },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: "https://www.facebook.com/nyambikadesign",
      label: "Facebook",
      color: "hover:text-white",
    },
    {
      icon: Twitter,
      href: "https://x.com/Nyambika1/",
      label: "Twitter",
      color: "hover:text-white",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/nyambika_official/",
      label: "Instagram",
      color: "hover:text-white",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/nyambikaofficial/",
      label: "LinkedIn",
      color: "hover:text-white",
    },
    {
      icon: MessageCircle,
      href: "https://wa.me/250782634364",
      label: "WhatsApp",
      color: "hover:text-white",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-neutral-950 mt-0">
      {/* subtle top border */}
      <div className="absolute inset-x-0 -top-px h-px bg-white/10" />

      {/* AI CTA banner */}
      <div className="container mx-auto px-4 sm:px-6 pt-14">
        <div className="relative overflow-hidden rounded-2xl bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 md:p-12">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neutral-800" />
                  </span>
                  {t("footer.liveBadge")}
                </span>
                <span className="text-xs text-neutral-400 hidden sm:block">
                  {t("footer.tryOutfits")}
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
                {t("footer.ctaTitle")}
              </h2>
              <p className="mt-3 text-neutral-500 max-w-lg text-sm leading-relaxed">
                {t("footer.ctaDesc")}
              </p>
            </div>
            {/* Right: CTAs */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                asChild
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-7 py-2.5 text-sm font-medium rounded-lg transition-colors"
              >
                <Link href="/try-on">{t("footer.startTryOn")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-neutral-200 text-neutral-700 hover:bg-neutral-50 px-7 py-2.5 text-sm font-medium rounded-lg transition-colors"
              >
                <Link href="/products">{t("footer.browseProducts")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <span className="text-neutral-900 text-lg font-bold tracking-tight">N</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Nyambika
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-sm max-w-xs">
              {t("footer.brandTagline")}
            </p>
            <div className="flex items-center gap-1">
              {socialLinks.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Button
                    key={i}
                    asChild
                    variant="ghost"
                    size="icon"
                    className={`rounded-md p-2 text-neutral-500 hover:bg-white/8 transition-colors ${s.color}`}
                    aria-label={s.label}
                  >
                    <a href={s.href} target="_blank" rel="noreferrer noopener">
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Newsletter */}
          <div className="text-sm">
            <h3 className="text-xs font-semibold text-neutral-300 tracking-widest mb-4 uppercase">
              {t("footer.stayUpdated")}
            </h3>
            <p className="text-neutral-500 mb-4 text-sm">{t("footer.subscribeDesc")}</p>
            <form
              className="flex w-full items-center gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
                if (!emailRegex.test(email)) {
                  toast?.({
                    title: t("footer.invalidEmailTitle"),
                    description: t("footer.invalidEmailDesc"),
                    variant: "destructive",
                  });
                  return;
                }
                try {
                  setSubmitting(true);
                  const { data } = await apiClient.post(
                    API_ENDPOINTS.NEWSLETTER_SUBSCRIBE,
                    { email, source: "footer" }
                  );
                  if (data?.ok) {
                    toast?.({
                      title: data.already
                        ? t("footer.alreadySubscribed")
                        : t("footer.subscribed"),
                      description: data.already
                        ? t("footer.alreadySubscribedDesc")
                        : t("footer.subscribedDesc"),
                    });
                    setEmail("");
                  } else {
                    toast?.({
                      title: t("footer.subscriptionFailed"),
                      description: t("footer.subscriptionFailedDesc"),
                      variant: "destructive",
                    });
                  }
                } catch (err) {
                  const msg = handleApiError(err);
                  toast?.({
                    title: t("footer.subscriptionFailed"),
                    description: msg,
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
                placeholder={t("footer.emailPlaceholder")}
                className="bg-white/5 text-white placeholder:text-neutral-600 border-white/10 focus:border-white/30 rounded-lg"
                required
                aria-label={t("footer.emailAria")}
              />
              <Button
                type="submit"
                className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg font-medium shrink-0"
                disabled={submitting}
              >
                {submitting ? t("footer.subscribing") : t("footer.subscribe")}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-neutral-500">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" /> +250 782 634 364
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" /> info@nyambika.com
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0" /> Kigali, Rwanda
              </div>
              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 text-neutral-300 hover:bg-white/5 hover:text-white rounded-lg text-sm"
                >
                  <a
                    href="https://wa.me/250782634364"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={t("footer.whatsappAria")}
                  >
                    {t("footer.chatWhatsApp")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-white/8" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-neutral-600 text-xs">
          <div className="text-center md:text-left">
            {t("footer.copyright").replace("{year}", String(year))}{" "}
            {t("footer.allRights")}
          </div>
          <div className="w-full grid grid-cols-2 md:flex items-center justify-center gap-5">
            {legalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-neutral-300 transition-colors"
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
        aria-label={t("footer.backToTop")}
        className={`fixed bottom-6 right-6 z-40 rounded-full p-3 transition-all duration-300 bg-white hover:bg-neutral-100 text-neutral-900 shadow-lg ${
          showTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </footer>
  );
}
