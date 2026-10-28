/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CountryCode, UserProfile, Product, CartItem } from './types';
import { getSavedProducts, initCatalogRealtimeSync } from './data/catalog';
import { initScheduleRealtimeSync } from './data/scheduleConfig';
import { initAdminSessionLifecycle } from './data/adminAuth';
import { Header } from './components/Header';
import { NoticeBanner } from './components/NoticeBanner';
import { Hero } from './components/Hero';
import { FeaturedVideoSection } from './components/FeaturedVideoSection';
import { CatalogSection } from './components/CatalogSection';
import { PaymentMethodsSection } from './components/PaymentMethodsSection';
import { AffiliateSection } from './components/AffiliateSection';
import { AppointmentSection } from './components/AppointmentSection';
import { WhatsAppSimulationSection } from './components/WhatsAppSimulationSection';
import { CartDrawer } from './components/CartDrawer';
import { ChatbotWidget } from './components/ChatbotWidget';
import { FloatingActions } from './components/FloatingActions';
import { Footer } from './components/Footer';

export default function App() {
  const [country, setCountry] = useState<CountryCode>('mexico');
  const [profile, setProfile] = useState<UserProfile>('comprador');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    initCatalogRealtimeSync();
    initScheduleRealtimeSync();
    initAdminSessionLifecycle();

    const syncCartWithCatalog = () => {
      const latestProducts = getSavedProducts();
      setCartItems((prev) =>
        prev
          .map((item) => {
            const updatedProd = latestProducts.find((p) => p.id === item.product.id);
            if (!updatedProd || updatedProd.available === false) return null;
            return { ...item, product: updatedProd };
          })
          .filter((item): item is CartItem => item !== null)
      );
    };

    window.addEventListener('catalog_products_updated', syncCartWithCatalog);
    return () => window.removeEventListener('catalog_products_updated', syncCartWithCatalog);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showNotification(`¡${product.name} agregado a tu cotización!`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-2xl shadow-emerald-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header with Country and Profile Selectors */}
      <Header
        country={country}
        onCountryChange={setCountry}
        profile={profile}
        onProfileChange={setProfile}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenSimulator={() => scrollToSection('simulador-whatsapp')}
      />

      {/* Mandatory Official Notice Banner */}
      <NoticeBanner />

      {/* Hero Presentation */}
      <Hero
        country={country}
        profile={profile}
        onExploreCatalog={() => scrollToSection('catalogo')}
        onGoToVideo={() => scrollToSection('video-oficial')}
        onGoToPayments={() => scrollToSection('pagos')}
        onGoToAffiliates={() => scrollToSection('afiliados')}
        onGoToAppointments={() => scrollToSection('citas')}
        onGoToSimulator={() => scrollToSection('simulador-whatsapp')}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Main Sections */}
      <main className="flex-1">
        {/* Large Official Video Player (Manual Play Only - No Autoplay) */}
        <FeaturedVideoSection />

        {/* Catalog & Prices */}
        <CatalogSection
          country={country}
          onAddToCart={handleAddToCart}
          onOpenOrderModal={() => setIsCartOpen(true)}
        />

        {/* Live Inbound WhatsApp Conversation Simulation */}
        <WhatsAppSimulationSection />

        {/* Payment Methods & Strict Concept Rule */}
        <PaymentMethodsSection country={country} />

        {/* Affiliate Program & Rewards */}
        <AffiliateSection />

        {/* Priority Appointments & Channeling */}
        <AppointmentSection country={country} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        country={country}
        profile={profile}
      />

      {/* Chatbot Virtual Assistant */}
      <ChatbotWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        country={country}
        profile={profile}
      />

      {/* Floating Action Buttons */}
      <FloatingActions
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
      />
    </div>
  );
}
