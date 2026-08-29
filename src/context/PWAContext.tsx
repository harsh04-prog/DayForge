'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as serviceWorkerRegistration from '../utils/serviceWorkerRegistration';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;
  dismissInstallBanner: () => void;
  showInstallBanner: boolean;
  openInstallGuide: () => void;
  isInstallGuideOpen: boolean;
  closeInstallGuide: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Check if iOS
  const isIOS =
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  useEffect(() => {
    // 1. Check if already installed / standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // 2. Listen for beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      const hasDismissed = localStorage.getItem('dayforge_install_dismissed_v1');
      if (!hasDismissed && !isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem('dayforge_install_dismissed_v1', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Online / Offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 5. Register Service Worker with update detection
    serviceWorkerRegistration.register({
      onUpdate: (registration) => {
        setIsUpdateAvailable(true);
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
        }
      },
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      if (isIOS) {
        setIsInstallGuideOpen(true);
      }
      return false;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      return true;
    } else {
      dismissInstallBanner();
      return false;
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('dayforge_install_dismissed_v1', 'true');
  };

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isOnline,
        isUpdateAvailable,
        promptInstall,
        applyUpdate,
        dismissInstallBanner,
        showInstallBanner,
        openInstallGuide: () => setIsInstallGuideOpen(true),
        closeInstallGuide: () => setIsInstallGuideOpen(false),
        isInstallGuideOpen,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
