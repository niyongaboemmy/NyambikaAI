import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/custom-ui/dialog";
import { Button } from "@/components/custom-ui/button";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { FormInput } from "@/components/custom-ui/form-input";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Image,
  Link as LinkIcon,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function CompanyModal() {
  const {
    company,
    isMissing,
    modalOpen,
    setModalOpen,
    createCompany,
    updateCompany,
    isLoading,
  } = useCompany();
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    tin: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    logoUrl: "",
    websiteUrl: "",
  });
  const isEdit = useMemo(() => !!company?.id, [company?.id]);
  const isFormValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.location.trim().length > 0
    );
  }, [form.name, form.email, form.phone, form.location]);

  useEffect(() => {
    if (company) {
      setForm({
        tin: company.tin || "",
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        location: company.location || "",
        logoUrl: company.logoUrl || "",
        websiteUrl: company.websiteUrl || "",
      });
    } else {
      setForm({
        tin: "",
        name: "",
        email: user?.email || "",
        phone: "",
        location: "",
        logoUrl: "",
        websiteUrl: "",
      });
    }
  }, [company, user?.email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tin: form.tin || null,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      logoUrl: form.logoUrl ? form.logoUrl.trim() : null,
      websiteUrl: form.websiteUrl ? form.websiteUrl.trim() : null,
    };
    if (isEdit) await updateCompany(payload);
    else await createCompany(payload as any);
  };

  // Open only when we have confirmed the company is missing (isMissing)
  // This avoids opening during initial load before data is fetched
  const shouldOpen =
    (!!user && user.role === "producer" && isMissing) || (isEdit && modalOpen);

  if (!user || user.role !== "producer") return null;

  return (
    <Dialog
      open={shouldOpen}
      onOpenChange={(open) => {
        // Prevent closing when company is missing and form is not valid
        if (!open && isMissing && !isFormValid) return;
        setModalOpen(open);
      }}
    >
      <DialogContent
        className="max-w-2xl rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-3"
        style={{
          height: "calc(100vh - 200px)",
        }}
        onInteractOutside={(e) => {
          // Disallow dismiss while company is missing or loading
          if (isMissing || isLoading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Disallow dismiss while company is missing or loading
          if (isMissing || isLoading) e.preventDefault();
        }}
      >
        <DialogHeader className="relative px-2 md:px-3 mb-3">
          {/* AI-themed header decoration */}
          {/* <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div> */}

          <DialogTitle className="flex items-center gap-2 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Building2 className="w-5 h-5 text-blue-600" />
            {isEdit ? "Edit Company Details" : "Set Up Your Company"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 italic text-xs">
            {isEdit
              ? "Update your business information used across the platform."
              : "Please provide your business details to start selling on Nyambika."}
          </DialogDescription>
        </DialogHeader>
        {/* Loading overlay */}
        {isLoading && (
          <div className="px-3 absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isEdit ? "Updating company..." : "Creating company..."}
              </p>
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 relative px-2 md:px-3">
          <div className="grid grid-cols-1 gap-4">
            <FormInput
              id="name"
              label="Company Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.currentTarget.value })
              }
              required
              icon={Building2}
              placeholder="e.g., Nyambika Ltd"
              disabled={isLoading}
            />
            <FormInput
              id="email"
              type="email"
              label="Company Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.currentTarget.value })
              }
              required
              icon={Mail}
              placeholder="company@example.com"
              autoComplete="email"
              disabled={isLoading}
            />
            <FormInput
              id="phone"
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.currentTarget.value })
              }
              required
              icon={Phone}
              placeholder="e.g., +2507..."
              autoComplete="tel"
              disabled={isLoading}
            />
            <FormInput
              id="location"
              label="Location"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.currentTarget.value })
              }
              required
              icon={MapPin}
              placeholder="City, Country"
              disabled={isLoading}
            />
            <FormInput
              id="tin"
              label="TIN (optional)"
              value={form.tin}
              onChange={(e) => setForm({ ...form, tin: e.currentTarget.value })}
              icon={Hash}
              placeholder="Tax Identification Number"
              disabled={isLoading}
            />
            <FormInput
              id="logoUrl"
              type="url"
              label="Logo URL (optional)"
              value={form.logoUrl}
              onChange={(e) =>
                setForm({ ...form, logoUrl: e.currentTarget.value })
              }
              icon={Image}
              placeholder="https://..."
              disabled={isLoading}
            />
            <FormInput
              id="websiteUrl"
              type="url"
              label="Website URL (optional)"
              value={form.websiteUrl}
              onChange={(e) =>
                setForm({ ...form, websiteUrl: e.currentTarget.value })
              }
              icon={LinkIcon}
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            {/* Logout button on the left to allow user to exit flow */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logout();
              }}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Logout
            </Button>

            {/* Form action buttons on the right */}
            <div className="flex justify-end gap-2">
              {/* Allow closing only when editing OR when required fields are valid */}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
                disabled={isMissing || isLoading}
                className="min-w-[80px]"
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEdit ? "Saving..." : "Creating..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {isEdit ? "Save Changes" : "Create Company"}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
