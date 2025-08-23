import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CompanyModal() {
  const { company, isMissing, modalOpen, setModalOpen, createCompany, updateCompany } = useCompany();
  const { user } = useAuth();
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

  const shouldOpen = isMissing || isEdit ? modalOpen : false;

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
        className="max-w-lg"
        onInteractOutside={(e) => {
          if (isMissing && !isFormValid) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isMissing && !isFormValid) e.preventDefault();
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
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="email">Company Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="tin">TIN (optional)</Label>
              <Input id="tin" value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input id="logoUrl" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="websiteUrl">Website URL (optional)</Label>
              <Input id="websiteUrl" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {/* Allow closing only when editing OR when required fields are valid */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={isMissing && !isFormValid}
            >
              Close
            </Button>
            <Button type="submit" disabled={!isFormValid}>{isEdit ? 'Save Changes' : 'Save Company'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
