import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check if iOS (Safari or Chrome on iOS both use WebKit)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    
    // Debug log
    console.log('[PWA] iOS:', ios, 'Standalone:', standalone, 'UserAgent:', navigator.userAgent);

    // Check if user dismissed before (with 7-day expiry)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay (not immediately on page load)
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show custom prompt after delay
    if (ios && !standalone) {
      console.log('[PWA] iOS detected, showing prompt in 3 seconds...');
      setTimeout(() => {
        console.log('[PWA] Setting showPrompt to true');
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Debug current state
  console.log('[PWA] Render - showPrompt:', showPrompt, 'isIOS:', isIOS, 'isStandalone:', isStandalone, 'dismissed:', dismissed);

  // Don't show if already installed, dismissed, or not applicable
  if (isStandalone || dismissed || !showPrompt) return null;

  // iOS-specific prompt (can't auto-install on iOS)
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[9999]" style={{ transform: 'translateY(0)', transition: 'transform 0.3s ease-out' }}>
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl">
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-white"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center flex-shrink-0">
              <Smartphone size={20} className="text-[#00FF00]" />
            </div>
            <div className="flex-1 pr-6">
              <p className="text-white font-semibold text-sm">App installieren</p>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Tippe auf{' '}
                <span className="inline-flex items-center align-middle mx-0.5">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                  </svg>
                </span>
                {' '}und dann <span className="text-white font-medium">"Zum Home-Bildschirm"</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[9999]" style={{ transform: 'translateY(0)', transition: 'transform 0.3s ease-out' }}>
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-[#00FF00]" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">App installieren</p>
              <p className="text-zinc-400 text-xs">Schneller Zugriff vom Homescreen</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDismiss}
                className="px-3 py-1.5 text-zinc-400 text-xs hover:text-white transition-colors"
              >
                Später
              </button>
              <button 
                onClick={handleInstall}
                className="px-4 py-1.5 bg-[#00FF00] text-black text-xs font-bold rounded-lg hover:bg-[#00FF00]/80 transition-colors"
              >
                Installieren
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;
