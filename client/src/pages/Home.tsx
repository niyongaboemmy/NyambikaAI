import { useEffect } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import HeroSection from '@/components/HeroSection';
import CategoryCards from '@/components/CategoryCards';
import AITryOnStudio from '@/components/AITryOnStudio';
import ProductShowcase from '@/components/ProductShowcase';
import PaymentMethods from '@/components/PaymentMethods';
import Footer from '@/components/Footer';
import FloatingActionButton from '@/components/FloatingActionButton';

export default function Home() {
  useEffect(() => {
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    // Observe all sections for scroll animations
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      observer.observe(section);
    });

    // Parallax effect for hero section
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector('#home');
      if (hero) {
        (hero as HTMLElement).style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800 transition-all duration-500">
      <RoleBasedNavigation userRole="customer" userName="Marie Uwimana" />
      <HeroSection />
      <CategoryCards />
      <AITryOnStudio />
      <ProductShowcase />
      <PaymentMethods />
      <Footer />
      <FloatingActionButton />
    </div>
  );
}
