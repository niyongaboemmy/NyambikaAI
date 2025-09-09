"use client";

import React, { useEffect, useState } from "react";
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
  url?: string;
  icon?: string;
  hashtags?: string[];
  via?: string;
};

export type ShareProps = {
  metadata?: ShareMetadata; // Now optional!
  triggerClassName?: string;
  triggerLabel?: string;
  size?: "sm" | "md";
};

const buildUrl = (m: ShareMetadata) => {
  const url =
    m.url || (typeof window !== "undefined" ? window.location.href : "");
  const text = encodeURIComponent(
    m.title + (m.description ? ` — ${m.description}` : "")
  );
  const hashtags = m.hashtags?.map((h) => h.replace(/^#/, "")).join(",");

  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(
      url
    )}${m.via ? `&via=${encodeURIComponent(m.via)}` : ""}${
      hashtags ? `&hashtags=${hashtags}` : ""
    }`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`,
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(
      url
    )}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(
      url
    )}&text=${text}`,
    email: `mailto:?subject=${encodeURIComponent(
      m.title
    )}&body=${text}%0A${encodeURIComponent(url)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(
      url
    )}&title=${text}`,
    pinterest: m.icon
      ? `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
          url
        )}&media=${encodeURIComponent(m.icon)}&description=${text}`
      : undefined,
  };
};

export default function Share({
  metadata,
  triggerClassName,
  triggerLabel = "Share",
  size = "md",
}: ShareProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [autoMeta, setAutoMeta] = useState<ShareMetadata | null>(null);

  // Extract Open Graph / Meta tags automatically
  useEffect(() => {
    if (metadata) return; // If metadata passed, skip auto-fetch

    const ogTitle =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") || document.title;

    const ogDesc =
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") ||
      "";

    const ogImage =
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content") || "";

    const url = window.location.href;

    setAutoMeta({
      title: ogTitle,
      description: ogDesc,
      icon: ogImage,
      url,
    });
  }, [metadata]);

  const meta = metadata || autoMeta;

  if (!meta) {
    // While waiting for metadata to load
    return null;
  }

  const urls = buildUrl(meta);

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined") return;
    const url = meta.url || window.location.href;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: meta.title,
          text: meta.description || meta.title,
          url,
        });
        toast({ title: "Shared!", description: "Thanks for sharing 🎉" });
      } catch {
        /* user canceled */
      }
    } else {
      setOpen(true);
    }
  };

  const copyLink = async () => {
    try {
      const url = meta.url || window.location.href;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const shareNow = () => {
    if (!selected) {
      toast({ title: "Pick a platform first" });
      return;
    }
    const href = urls[selected as keyof typeof urls];
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
      setOpen(false);
      setSelected(null);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        className={triggerClassName}
        onClick={handleNativeShare}
      >
        <Share2 className="w-4 h-4" />
        <span className="ml-1">{triggerLabel}</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="panel"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-4 w-full max-w-md shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Share</h2>
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Platforms */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <PlatformCard
                  label="Twitter"
                  icon={<Twitter className="w-4 h-4" />}
                  selected={selected === "twitter"}
                  onClick={() => setSelected("twitter")}
                />
                <PlatformCard
                  label="Facebook"
                  icon={<Facebook className="w-4 h-4" />}
                  selected={selected === "facebook"}
                  onClick={() => setSelected("facebook")}
                />
                <PlatformCard
                  label="LinkedIn"
                  icon={<Linkedin className="w-4 h-4" />}
                  selected={selected === "linkedin"}
                  onClick={() => setSelected("linkedin")}
                />
                <PlatformCard
                  label="WhatsApp"
                  icon={<MessageCircle className="w-4 h-4" />}
                  selected={selected === "whatsapp"}
                  onClick={() => setSelected("whatsapp")}
                />
                <PlatformCard
                  label="Telegram"
                  icon={<Send className="w-4 h-4" />}
                  selected={selected === "telegram"}
                  onClick={() => setSelected("telegram")}
                />
                <PlatformCard
                  label="Email"
                  icon={<Mail className="w-4 h-4" />}
                  selected={selected === "email"}
                  onClick={() => setSelected("email")}
                />
                <PlatformCard
                  label="Reddit"
                  icon={<Hash className="w-4 h-4" />}
                  selected={selected === "reddit"}
                  onClick={() => setSelected("reddit")}
                />
                {urls.pinterest && (
                  <PlatformCard
                    label="Pinterest"
                    icon={<Bookmark className="w-4 h-4" />}
                    selected={selected === "pinterest"}
                    onClick={() => setSelected("pinterest")}
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={shareNow}>
                  Share now
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={copyLink}
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy link
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PlatformCard({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
}
