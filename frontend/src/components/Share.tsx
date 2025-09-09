"use client";

import React from "react";
import { Button } from "@/components/custom-ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Copy,
  Send,
  Bookmark,
  Hash,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ShareMetadata = {
  title: string;
  description?: string;
  url?: string; // defaults to current location
  icon?: string; // logo/image url
  hashtags?: string[];
  via?: string; // twitter via
};

export type ShareProps = {
  metadata: ShareMetadata;
  triggerClassName?: string;
  triggerLabel?: string;
  size?: "sm" | "md";
};

const buildUrl = (m: ShareMetadata) => {
  // Resolve base URL for absolute paths (client-safe since this is a client component)
  const SITE_URL =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const absolute = (input?: string): string | undefined => {
    if (!input) return undefined;
    // If already absolute (http/https/data), return as is
    if (/^(https?:)?\/\//i.test(input) || input.startsWith("data:")) return input;
    try {
      return new URL(input, SITE_URL).toString();
    } catch {
      return input;
    }
  };

  const defaultLogo = absolute("/nyambika_light_icon.png") || undefined;
  const shareImage = absolute(m.icon) || defaultLogo;

  const url = m.url || (typeof window !== "undefined" ? window.location.href : "");
  // Some platforms only read OG tags from the target URL. Our server-side metadata
  // (store/[id]/layout.tsx) ensures correct OG for LinkedIn/Facebook.

  const composedText = m.title + (m.description ? ` — ${m.description}` : "");
  const text = encodeURIComponent(composedText);
  const hashtagStr = m.hashtags?.length
    ? m.hashtags.map((h) => (h.startsWith("#") ? h.slice(1) : h)).join(",")
    : undefined;
  const via = m.via ? m.via.replace(/^@/, "") : undefined;

  return {
    url,
    text,
    hashtagStr,
    image: shareImage,
    // Twitter/X
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}${
      via ? `&via=${encodeURIComponent(via)}` : ""
    }${hashtagStr ? `&hashtags=${encodeURIComponent(hashtagStr)}` : ""}`,
    // Facebook — URL only; preview comes from OG tags on the page
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    // LinkedIn — URL only; preview from OG tags
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    // WhatsApp
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(url)}`,
    // Telegram
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`,
    // Email
    email: `mailto:?subject=${encodeURIComponent(m.title)}&body=${text}%0A%0A${encodeURIComponent(url)}`,
    // Reddit — can pass title and url
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${text}`,
    // Pinterest requires a media (image) param to render a rich pin
    pinterest: shareImage
      ? `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(
          shareImage
        )}&description=${text}`
      : undefined,
  } as const;
};

export default function Share({
  metadata,
  triggerClassName,
  triggerLabel = "Share",
  size = "md",
}: ShareProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<
    | "twitter"
    | "facebook"
    | "linkedin"
    | "whatsapp"
    | "telegram"
    | "email"
    | "reddit"
    | "pinterest"
    | null
  >(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Reset selection when closing so reopening starts fresh
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setSelected(null), 150); // let exit animation finish
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleNativeShare = async () => {
    try {
      const url = metadata.url || window.location.href;
      const isMobile =
        typeof navigator !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      // Prefer our custom panel on desktop; use native sheet only on mobile
      if (navigator.share && isMobile) {
        await navigator.share({
          title: metadata.title,
          text: metadata.description || metadata.title,
          url,
        });
        toast({
          title: "Thanks for sharing!",
          description: "Your share was triggered successfully.",
        });
        setOpen(false);
      } else {
        setOpen(true);
      }
    } catch (e) {
      // user may cancel
    }
  };

  const copyLink = async () => {
    try {
      const url = metadata.url || window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share link copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy link.",
        variant: "destructive" as any,
      });
    }
  };

  const u = buildUrl(metadata);
  const sizeClasses = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <>
      <Button
        variant="secondary"
        className={triggerClassName}
        onClick={handleNativeShare}
      >
        <Share2 className="w-4 h-4" />
        <span className="ml-1 hidden sm:inline text-sm">{triggerLabel}</span>
        <span className="ml-1 sm:hidden text-sm">Share</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999]"
          >
            {/* Backdrop with subtle gradient and grain */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-indigo-900/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Floating particles / aurora layers */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute -top-16 -left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
              <span className="absolute bottom-0 -right-10 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            </div>

            {/* Panel (bottom-sheet on mobile, centered on desktop) */}
            <div
              className="absolute inset-0 flex items-end md:items-center justify-center p-0 md:p-4"
              onClick={() => setOpen(false)}
            >
              <motion.div
                key="panel"
                initial={{ y: 40, opacity: 0, scale: 1 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="relative w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative gradient top border */}
                <div className="hidden md:block absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500" />

                {/* Grabber for mobile bottom sheet */}
                <div className="md:hidden flex justify-center pt-2">
                  <div className="h-1.5 w-12 rounded-full bg-gray-400/50" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-3 md:pt-4">
                  <div className="flex items-center gap-2">
                    {metadata.icon ? (
                      <img
                        src={metadata.icon}
                        alt="icon"
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white/40"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        Share
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                        {metadata.title}
                      </div>
                    </div>
                  </div>
                  <button
                    className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 md:pb-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Choose a platform or copy the link
                  </div>

                  {/* Platforms grid with selectable state */}
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                    <PlatformCard
                      selected={selected === "twitter"}
                      label="Twitter / X"
                      onClick={() => setSelected("twitter")}
                      icon={<Twitter className="w-4 h-4" />}
                      color="from-gray-900 to-gray-700"
                    />
                    <PlatformCard
                      selected={selected === "facebook"}
                      label="Facebook"
                      onClick={() => setSelected("facebook")}
                      icon={<Facebook className="w-4 h-4" />}
                      color="from-blue-600 to-blue-400"
                    />
                    <PlatformCard
                      selected={selected === "linkedin"}
                      label="LinkedIn"
                      onClick={() => setSelected("linkedin")}
                      icon={<Linkedin className="w-4 h-4" />}
                      color="from-sky-600 to-sky-400"
                    />
                    <PlatformCard
                      selected={selected === "whatsapp"}
                      label="WhatsApp"
                      onClick={() => setSelected("whatsapp")}
                      icon={<MessageCircle className="w-4 h-4" />}
                      color="from-emerald-600 to-emerald-400"
                    />
                    <PlatformCard
                      selected={selected === "telegram"}
                      label="Telegram"
                      onClick={() => setSelected("telegram")}
                      icon={<Send className="w-4 h-4" />}
                      color="from-sky-500 to-sky-300"
                    />
                    <PlatformCard
                      selected={selected === "email"}
                      label="Email"
                      onClick={() => setSelected("email")}
                      icon={<Mail className="w-4 h-4" />}
                      color="from-rose-500 to-rose-300"
                    />
                    <PlatformCard
                      selected={selected === "reddit"}
                      label="Reddit"
                      onClick={() => setSelected("reddit")}
                      icon={<Hash className="w-4 h-4" />}
                      color="from-orange-500 to-amber-400"
                    />
                    {u.pinterest && (
                      <PlatformCard
                        selected={selected === "pinterest"}
                        label="Pinterest"
                        onClick={() => setSelected("pinterest")}
                        icon={<Bookmark className="w-4 h-4" />}
                        color="from-rose-600 to-pink-500"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 h-12 md:h-10 text-base md:text-sm"
                      onClick={() => {
                        const href =
                          selected === "twitter"
                            ? u.twitter
                            : selected === "facebook"
                            ? u.facebook
                            : selected === "linkedin"
                            ? u.linkedin
                            : selected === "whatsapp"
                            ? u.whatsapp
                            : selected === "telegram"
                            ? u.telegram
                            : selected === "email"
                            ? u.email
                            : selected === "reddit"
                            ? u.reddit
                            : selected === "pinterest"
                            ? u.pinterest
                            : undefined;
                        if (!href) {
                          toast({
                            title: "Select a platform",
                            description: "Please pick a platform to share.",
                            variant: "default" as any,
                          });
                          return;
                        }
                        // Close first to guarantee dialog closes even if popup is blocked
                        setOpen(false);
                        setSelected(null);
                        setTimeout(() => {
                          window.open(href, "_blank", "noopener,noreferrer");
                        }, 50);
                      }}
                    >
                      Share now
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 hover:bg-white/80 dark:hover:bg-gray-800/80 h-12 md:h-10 text-base md:text-sm"
                      onClick={copyLink}
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy link
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PlatformCard({
  selected,
  label,
  icon,
  onClick,
  color,
}: {
  selected: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl border transition overflow-hidden ${
        selected
          ? "scale-[1.04] border-transparent bg-gradient-to-br from-white/85 to-white/60 dark:from-gray-800/95 dark:to-gray-800/70 shadow-xl ring-4 ring-offset-0 ring-blue-400/80"
          : "border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 hover:bg-white/80 dark:hover:bg-gray-800/80"
      }`}
    >
      {/* gradient halo */}
      <span
        className={`absolute inset-x-6 -top-8 h-16 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition bg-gradient-to-r ${color}`}
      />
      <span
        className={`absolute inset-x-10 -bottom-10 h-16 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition bg-gradient-to-r ${color}`}
      />
      <span
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-lg text-white bg-gradient-to-br ${color} shadow-md shadow-black/10 ${
          selected ? "scale-110" : ""
        }`}
      >
        {icon}
      </span>
      <span
        className={`relative z-10 text-[12px] mt-1 text-center px-2 line-clamp-1 ${
          selected
            ? "font-semibold text-blue-700 dark:text-blue-300"
            : "text-gray-700 dark:text-gray-300 font-medium"
        }`}
      >
        {label}
      </span>
      {selected && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-xl ring-4 ring-blue-400/80" />
          <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-bold shadow ring-1 ring-white/80">
            ✓
          </span>
        </>
      )}
    </button>
  );
}
