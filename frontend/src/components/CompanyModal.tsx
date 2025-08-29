import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/ui/form-input';
import { Building2, Mail, Phone, MapPin, Hash, Image, Link as LinkIcon } from 'lucide-react';

export default function CompanyModal() {
  const { company, isMissing, modalOpen, setModalOpen, createCompany, updateCompany } = useCompany();
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    tin: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    logoUrl: '',
    websiteUrl: ''
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
        tin: company.tin || '',
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        location: company.location || '',
        logoUrl: company.logoUrl || '',
        websiteUrl: company.websiteUrl || ''
      });
    } else {
      setForm({ tin: '', name: '', email: user?.email || '', phone: '', location: '', logoUrl: '', websiteUrl: '' });
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

  // Always show for producers until company exists; use modalOpen only for edit mode
  const shouldOpen = (!!user && user.role === 'producer' && !company) || (isEdit && modalOpen);

  if (!user || user.role !== 'producer') return null;

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
        className="max-w-lg rounded-2xl"
        onInteractOutside={(e) => {
          // Disallow dismiss while company is missing
          if (isMissing) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Disallow dismiss while company is missing
          if (isMissing) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Company Details' : 'Set Up Your Company'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update your business information used across the platform.' : 'Please provide your business details to start selling.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <FormInput
              id="name"
              label="Company Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
              required
              icon={Building2}
              placeholder="e.g., Nyambika Ltd"
            />
            <FormInput
              id="email"
              type="email"
              label="Company Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
              required
              icon={Mail}
              placeholder="company@example.com"
              autoComplete="email"
            />
            <FormInput
              id="phone"
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
              required
              icon={Phone}
              placeholder="e.g., +2507..."
              autoComplete="tel"
            />
            <FormInput
              id="location"
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.currentTarget.value })}
              required
              icon={MapPin}
              placeholder="City, Country"
            />
            <FormInput
              id="tin"
              label="TIN (optional)"
              value={form.tin}
              onChange={(e) => setForm({ ...form, tin: e.currentTarget.value })}
              icon={Hash}
              placeholder="Tax Identification Number"
            />
            <FormInput
              id="logoUrl"
              type="url"
              label="Logo URL (optional)"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.currentTarget.value })}
              icon={Image}
              placeholder="https://..."
            />
            <FormInput
              id="websiteUrl"
              type="url"
              label="Website URL (optional)"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.currentTarget.value })}
              icon={LinkIcon}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* Logout button on the left to allow user to exit flow */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logout();
              }}
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
                disabled={isMissing}
              >
                Close
              </Button>
              <Button type="submit" disabled={!isFormValid}>{isEdit ? 'Save Changes' : 'Save Company'}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
