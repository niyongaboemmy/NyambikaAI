"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import { Input } from "@/components/custom-ui/input";
import { Textarea } from "@/components/custom-ui/textarea";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast?.({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    if (!emailRegex.test(form.email)) {
      toast?.({
        title: "Invalid email",
        description: "Please provide a valid email.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast?.({
        title: "Message sent",
        description: "Thanks for reaching out! We'll get back to you soon.",
      });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast?.({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact Form */}
      <Card className="lg:col-span-2 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Your name"
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
                required
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                Message
              </label>
              <Textarea
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="How can we help?"
                rows={6}
                required
                className="rounded-xl"
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
        <CardContent className="p-6 md:p-8 space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h3>
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2" /> +250 782 634 364
          </div>
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2" /> info@nyambika.com
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" /> Kigali, Rwanda
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
