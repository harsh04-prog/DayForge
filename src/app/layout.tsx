import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { HabitProvider } from '@/context/HabitContext';
import { TodoProvider } from '@/context/TodoContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PWAProvider } from '@/context/PWAContext';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { PWAUpdateToast } from '@/components/pwa/PWAUpdateToast';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { InstallGuideModal } from '@/components/pwa/InstallGuideModal';

export const metadata: Metadata = {
  title: 'DayForge — Build habits. Level yourself.',
  description: 'Turn your daily routines and habit tracking into a clean, compounding character progression system.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DayForge',
  },
  icons: {
    icon: [
      { url: '/dayforge-favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#6C5CE7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#F8F9FC]">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-[#F8F9FC] text-slate-900 min-h-screen antialiased">
        <ToastProvider>
          <AuthProvider>
            <HabitProvider>
              <TodoProvider>
                <NotificationProvider>
                  <PWAProvider>
                    {/* Global Offline Status */}
                    <OfflineIndicator />

                    {/* Global PWA Update Toast */}
                    <PWAUpdateToast />

                    {/* Main App Content */}
                    {children}

                    {/* Global PWA Banner & Guide Modal */}
                    <PWAInstallBanner />
                    <InstallGuideModal />
                  </PWAProvider>
                </NotificationProvider>
              </TodoProvider>
            </HabitProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
