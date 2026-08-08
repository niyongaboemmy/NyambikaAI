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
    { icon: Facebook, href: "https://www.facebook.com/nyambikadesign", label: "Facebook" },
    { icon: Twitter, href: "https://x.com/Nyambika1/", label: "Twitter" },
    { icon: Instagram, href: "https://www.instagram.com/nyambika_official/", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/nyambikaofficial/", label: "LinkedIn" },
    { icon: MessageCircle, href: "https://wa.me/250782634364", label: "WhatsApp" },
  ];

  return (
    <footer className="relative bg-muted/40 border-t border-border mt-0">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background text-base font-bold tracking-tight">N</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Nyambika
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">
              {t("footer.brandTagline")}
            </p>
            <div className="flex items-center gap-0.5">
              {socialLinks.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Button
                    key={i}
                    asChild
                    variant="ghost"
                    size="icon"
                    className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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

          {/* Newsletter + Contact */}
          <div className="text-sm">
            <h3 className="text-xs font-semibold text-muted-foreground tracking-widest mb-4 uppercase">
              {t("footer.stayUpdated")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">{t("footer.subscribeDesc")}</p>
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
                className="bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg"
                required
                aria-label={t("footer.emailAria")}
              />
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium shrink-0"
                disabled={submitting}
              >
                {submitting ? t("footer.subscribing") : t("footer.subscribe")}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-muted-foreground">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 shrink-0" /> +250 782 634 364
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 shrink-0" /> info@nyambika.com
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 shrink-0" /> Kigali, Rwanda
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-border" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-muted-foreground text-xs">
          <div className="text-center md:text-left">
            {t("footer.copyright").replace("{year}", String(year))}{" "}
            {t("footer.allRights")}
          </div>
          <div className="w-full grid grid-cols-2 md:flex items-center justify-center gap-5">
            {legalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-foreground transition-colors"
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
        className={`fixed bottom-6 right-6 z-40 rounded-full p-3 transition-all duration-300 bg-foreground text-background hover:opacity-90 border border-border ${
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
