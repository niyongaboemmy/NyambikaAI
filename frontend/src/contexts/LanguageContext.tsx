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
    // Pages
    'privacy.title': 'Privacy Policy',
    'privacy.subtitle': 'Learn how we collect, use, and protect your data at NyambikaAI.',
    'terms.title': 'Terms of Service',
    'terms.subtitle': 'The rules and conditions for using NyambikaAI and our services.',
    'cookies.title': 'Cookie Policy',
    'cookies.subtitle': 'How we use cookies and similar technologies to improve your experience.',
    'about.title': 'About NyambikaAI',
    'about.subtitle': "We are building the AI-powered fashion platform for Rwanda.",
    'contact.title': 'Get in Touch',
    'contact.subtitle': "We'd love to hear from you. Send us a message and our team will reply promptly.",
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
    // Pages
    'privacy.title': 'Politiki y’Ibanga',
    'privacy.subtitle': 'Uko dukusanya, dukoresha, kandi turinda amakuru yawe muri NyambikaAI.',
    'terms.title': 'Amasezerano yo Gukoresha',
    'terms.subtitle': 'Amategeko n’amabwiriza yo gukoresha NyambikaAI.',
    'cookies.title': 'Politiki ya Cookies',
    'cookies.subtitle': 'Uko dukoresha cookies kugira ngo tunoze uburyo ukoresha urubuga.',
    'about.title': 'Ibyerekeye NyambikaAI',
    'about.subtitle': 'Turimo kubaka urubuga rw’imyenda rufashijwe na AI mu Rwanda.',
    'contact.title': 'Tuvugishe',
    'contact.subtitle': 'Twishimiye ubutumwa bwawe. Twohereze ubutumwa tugusubize vuba.',
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
    // Pages
    'privacy.title': 'Politique de Confidentialité',
    'privacy.subtitle': 'Découvrez comment nous collectons, utilisons et protégeons vos données.',
    'terms.title': 'Conditions d’Utilisation',
    'terms.subtitle': "Les règles et conditions d'utilisation de NyambikaAI.",
    'cookies.title': 'Politique des Cookies',
    'cookies.subtitle': 'Comment nous utilisons les cookies pour améliorer votre expérience.',
    'about.title': 'À propos de NyambikaAI',
    'about.subtitle': 'Nous construisons la plateforme de mode alimentée par l’IA pour le Rwanda.',
    'contact.title': 'Nous contacter',
    'contact.subtitle': 'Envoyez-nous un message et notre équipe vous répondra rapidement.',
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
