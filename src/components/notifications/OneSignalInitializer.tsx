'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { Bell, Sparkles, X } from 'lucide-react';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '5dc2a447-be3d-4af2-87b6-367347e201ce';

export const OneSignalInitializer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      });

      // Check permission state
      const permission = await OneSignal.Notifications.permission;
      if (permission === 'default') {
        // Show polite opt-in banner after 3 seconds
        setTimeout(() => {
          if (!localStorage.getItem('dayforge_onesignal_dismissed')) {
            setShowPromptBanner(true);
          }
        }, 3000);
      }
    });
  }, []);

  // Bind OneSignal user ID to database user.id on login/session
  useEffect(() => {
    if (typeof window === 'undefined' || !window.OneSignalDeferred) return;

    if (isAuthenticated && user?.id) {
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.login(String(user.id));

          // Capture Player/Subscription ID
          const subId = OneSignal.User?.PushSubscription?.id;
          if (subId) {
            fetch('/api/v1/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscriptionId: subId }),
            }).catch(() => {});
          }

          // Listen for push subscription id updates
          OneSignal.User?.PushSubscription?.addEventListener('change', (event: any) => {
            const newSubId = event?.current?.id || OneSignal.User?.PushSubscription?.id;
            if (newSubId) {
              fetch('/api/v1/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: newSubId }),
              }).catch(() => {});
            }
          });
        } catch (e) {
          console.warn('OneSignal login error:', e);
        }
      });
    } else if (!isAuthenticated) {
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.logout();
        } catch (e) {
          console.warn('OneSignal logout error:', e);
        }
      });
    }
  }, [isAuthenticated, user?.id]);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !window.OneSignalDeferred) return;

    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.Notifications.requestPermission();
        setShowPromptBanner(false);
      } catch (err) {
        console.error('Error requesting OneSignal permission:', err);
      }
    });
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    setIsPromptDismissed(true);
    try {
      localStorage.setItem('dayforge_onesignal_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />

      {showPromptBanner && !isPromptDismissed && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7] flex items-center justify-center text-white shrink-0 shadow-md">
              <Bell className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#FFB547]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Never Miss A Habit</span>
              </div>
              <h4 className="text-sm font-black text-white mt-0.5">
                Enable Lock Screen Reminders
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Get witty daily nudges on your phone or lock screen when it’s time to hydrate, workout, or study.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-black rounded-xl shadow-md transition-colors"
                >
                  Turn On Reminders 🔔
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
