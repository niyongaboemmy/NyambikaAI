import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  id?: string;
  producerId?: string;
  tin?: string | null;
  name: string;
  email: string;
  phone: string;
  location: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string;
}

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  isMissing: boolean;
  refresh: () => Promise<void>;
  createCompany: (data: Omit<Company, 'id' | 'producerId' | 'createdAt'>) => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMissing, setIsMissing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const token = useMemo(() => localStorage.getItem('auth_token'), [user?.id]);

  const refresh = async () => {
    if (!user || user.role !== 'producer' || !token) {
      setCompany(null);
      setIsMissing(false);
      setModalOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/companies/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 404) {
        setCompany(null);
        setIsMissing(true);
        setModalOpen(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to load company');
      const data = await res.json();
      setCompany(data);
      setIsMissing(false);
    } catch (e: any) {
      console.error('Company load error:', e);
      toast({ title: 'Company', description: e.message || 'Failed to load company', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async (data: Omit<Company, 'id' | 'producerId' | 'createdAt'>) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create company');
      }
      const created = await res.json();
      setCompany(created);
      setIsMissing(false);
      setModalOpen(false);
      toast({ title: 'Company saved', description: 'Your company details were created.' });
    } catch (e: any) {
      toast({ title: 'Company', description: e.message, variant: 'destructive' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update company');
      }
      const updated = await res.json();
      setCompany(updated);
      toast({ title: 'Company updated', description: 'Your company details were updated.' });
    } catch (e: any) {
      toast({ title: 'Company', description: e.message, variant: 'destructive' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // load on login change
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const value: CompanyContextType = {
    company,
    isLoading,
    isMissing,
    refresh,
    createCompany,
    updateCompany,
    modalOpen,
    setModalOpen,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}
