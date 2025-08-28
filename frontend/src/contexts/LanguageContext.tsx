import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'rw' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Basic translations - can be expanded
const translations = {
  en: {
    home: 'Home',
    companies: 'Companies',
    tryOn: 'Try-On',
    products: 'Products',
    cart: 'Cart',
    profile: 'Profile',
    signIn: 'Sign In',
    signOut: 'Sign Out',
  },
  rw: {
    home: 'Urugo',
    companies: 'Ibigo',
    tryOn: 'Gerageza',
    products: 'Ibicuruzwa',
    cart: 'Igikoni',
    profile: 'Umwirondoro',
    signIn: 'Kwinjira',
    signOut: 'Gusohoka',
  },
  fr: {
    home: 'Accueil',
    companies: 'Entreprises',
    tryOn: 'Essayer',
    products: 'Produits',
    cart: 'Panier',
    profile: 'Profil',
    signIn: 'Se connecter',
    signOut: 'Se déconnecter',
  },
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get language from localStorage after component mounts
    const saved = localStorage.getItem('nyambika-language');
    if (saved && (saved === 'en' || saved === 'rw' || saved === 'fr')) {
      setLanguageState(saved as Language);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (isClient) {
      localStorage.setItem('nyambika-language', newLanguage);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };


  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
