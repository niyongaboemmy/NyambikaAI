"use client";

import React from "react";
import { Button } from "@/components/custom-ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/custom-ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Link as LinkIcon, Mail, Twitter, Facebook, Linkedin, MessageCircle, Copy, Send, Bookmark, Hash } from "lucide-react";

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
  const url = m.url || (typeof window !== "undefined" ? window.location.href : "");
  const text = encodeURIComponent(m.title + (m.description ? ` — ${m.description}` : ""));
  const hashtagStr = m.hashtags?.length ? m.hashtags.map(h => (h.startsWith("#") ? h.slice(1) : h)).join(",") : undefined;
  return {
    url,
    text,
    hashtagStr,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}${m.via ? `&via=${encodeURIComponent(m.via)}` : ""}${hashtagStr ? `&hashtags=${encodeURIComponent(hashtagStr)}` : ""}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`,
    email: `mailto:?subject=${encodeURIComponent(m.title)}&body=${text}%0A%0A${encodeURIComponent(url)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${text}`,
    pinterest: m.icon ? `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(m.icon)}&description=${text}` : undefined,
  };
};

export default function Share({ metadata, triggerClassName, triggerLabel = "Share", size = "md" }: ShareProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const handleNativeShare = async () => {
    try {
      const url = metadata.url || window.location.href;
      if (navigator.share) {
        await navigator.share({ title: metadata.title, text: metadata.description || metadata.title, url });
        toast({ title: "Thanks for sharing!", description: "Your share was triggered successfully." });
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
      toast({ title: "Link copied", description: "Share link copied to your clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy link.", variant: "destructive" as any });
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            <ShareLink href={u.twitter} label="Twitter / X" icon={<Twitter className="w-4 h-4" />} />
            <ShareLink href={u.facebook} label="Facebook" icon={<Facebook className="w-4 h-4" />} />
            <ShareLink href={u.linkedin} label="LinkedIn" icon={<Linkedin className="w-4 h-4" />} />
            <ShareLink href={u.whatsapp} label="WhatsApp" icon={<MessageCircle className="w-4 h-4" />} />
            <ShareLink href={u.telegram} label="Telegram" icon={<Send className="w-4 h-4" />} />
            <ShareLink href={u.email} label="Email" icon={<Mail className="w-4 h-4" />} />
            <ShareLink href={u.reddit} label="Reddit" icon={<Hash className="w-4 h-4" />} />
            {u.pinterest && (
              <ShareLink href={u.pinterest} label="Pinterest" icon={<Bookmark className="w-4 h-4" />} />
            )}
            <button
              onClick={copyLink}
              className={`flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${sizeClasses}`}
            >
              <Copy className="w-4 h-4" /> Copy link
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Sharing: <span className="font-medium">{metadata.title}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShareLink({ href, label, icon }: { href?: string; label: string; icon: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 transition h-10 px-4 text-sm"
    >
      {icon} {label}
    </a>
  );
}
