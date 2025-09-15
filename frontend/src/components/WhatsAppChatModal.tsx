"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/custom-ui/dialog";
import { Button } from "@/components/custom-ui/button";
import { Badge } from "@/components/custom-ui/badge";
import { Textarea } from "@/components/custom-ui/textarea";
import { MessageCircle, Phone, CheckCircle2, XCircle } from "lucide-react";

export interface WhatsAppChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  producer: { id: string; name?: string | null; phone?: string | null };
  product: { id: string; name: string; url?: string };
  online?: { isOnline: boolean; lastSeen?: string | null } | null;
  defaultMessage?: string;
}

const buildWhatsAppUrl = (phoneRaw: string, message: string) => {
  // Normalize Rwandan numbers (may start with 07, 2507, +2507). Keep digits only and ensure country code
  const digits = phoneRaw.replace(/[^0-9+]/g, "");
  let phone = digits;
  if (digits.startsWith("+")) {
    phone = digits.slice(1);
  } else if (digits.startsWith("0")) {
    phone = `250${digits.slice(1)}`; // assume Rwanda +250
  } else if (digits.length === 9) {
    phone = `250${digits}`;
  }
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
};

export default function WhatsAppChatModal({
  isOpen,
  onOpenChange,
  producer,
  product,
  online,
  defaultMessage,
}: WhatsAppChatModalProps) {
  const [message, setMessage] = useState<string>(defaultMessage || "");

  useEffect(() => {
    if (isOpen) setMessage(defaultMessage || "");
  }, [isOpen, defaultMessage]);

  const statusBadge = useMemo(() => {
    if (!online) return null;
    if (online.isOnline) {
      return (
        <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />{" "}
          Online now
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        {online.lastSeen
          ? `Last seen ${new Date(online.lastSeen).toLocaleTimeString()}`
          : "Offline"}
      </Badge>
    );
  }, [online]);

  const canSend = Boolean(producer?.phone && message.trim().length > 0);

  const handleSend = () => {
    if (!producer?.phone) return;
    const url = buildWhatsAppUrl(producer.phone, message);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <MessageCircle className="w-4 h-4" />
            </span>
            Chat with {producer?.name || "Producer"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 px-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div className="font-medium">{product.name}</div>
              {product.url && (
                <a
                  href={product.url}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  target="_blank"
                  rel="noreferrer"
                >
                  View product
                </a>
              )}
            </div>
            <div>{statusBadge}</div>
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Type your message"
            className="w-full rounded-xl"
          />

          {!producer?.phone && (
            <div className="text-xs text-amber-600 dark:text-amber-400">
              Producer phone number is not available. You can call the store or
              try later.
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Phone className="w-4 h-4 mr-1" /> Send on WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
