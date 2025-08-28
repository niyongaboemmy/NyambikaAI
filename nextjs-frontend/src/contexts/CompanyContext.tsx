import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient, handleApiError } from '@/config/api';

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

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('auth_token'));
    }
  }, [user?.id]);

  const refresh = async () => {
    if (!user || user.role !== 'producer' || !token) {
      setCompany(null);
      setIsMissing(false);
      setModalOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/companies/me');
      setCompany(response.data);
      setIsMissing(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCompany(null);
        setIsMissing(true);
        setModalOpen(true);
      } else {
        console.error('Error fetching company:', handleApiError(error));
        setCompany(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async (data: Omit<Company, 'id' | 'producerId' | 'createdAt'>) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/companies', data);
      setCompany(response.data);
      setIsMissing(false);
      setModalOpen(false);
      toast({ title: 'Company saved', description: 'Your company details were created.' });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      toast({ title: 'Company', description: errorMessage, variant: 'destructive' });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await apiClient.put('/api/companies', updates);
      setCompany(response.data);
      toast({ title: 'Company updated', description: 'Your company details were updated.' });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      toast({ title: 'Company', description: errorMessage, variant: 'destructive' });
      throw new Error(errorMessage);
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
