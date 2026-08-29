'use client';

import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Download, Share, PlusSquare, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

export const InstallGuideModal: React.FC = () => {
  const { isInstallGuideOpen, closeInstallGuide, isInstallable, promptInstall, isIOS, isInstalled } = usePWA();

  return (
    <Modal
      isOpen={isInstallGuideOpen}
      onClose={closeInstallGuide}
      title="Install DayForge App"
      description="Experience DayForge as a standalone application on your device."
    >
      <div className="space-y-5 text-slate-800">
        {/* App Summary Card */}
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/icons/icon-192x192.png"
              alt="DayForge Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900 leading-tight">DayForge</h4>
            <p className="text-xs text-slate-500 mt-0.5">Build habits. Level yourself.</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Screen • Fast Launch • Offline Shell</span>
            </div>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>DayForge is already installed on this device! Launch it anytime from your home screen or application launcher.</span>
          </div>
        ) : isIOS ? (
          /* iOS Safari Step-by-Step Instructions */
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Install on iPhone / iPad (Safari)
            </h5>

            <div className="space-y-2.5 text-xs font-medium text-slate-700">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-black shrink-0">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">Tap the Share button</p>
                  <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                    Tap <Share className="w-3.5 h-3.5 inline text-[#6C5CE7]" /> at the bottom or top of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-black shrink-0">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">Select "Add to Home Screen"</p>
                  <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-[#6C5CE7]" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-black shrink-0">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">Tap "Add"</p>
                  <p className="text-slate-500 mt-0.5">
                    DayForge will now appear as an app icon on your iPhone home screen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome / Edge / Desktop */
          <div className="space-y-3.5 text-xs text-slate-600">
            <p className="leading-relaxed">
              Installing DayForge allows you to open your daily habit dashboard instantly in full-screen mode, with no browser address bar or tabs.
            </p>

            {isInstallable ? (
              <Button
                variant="primary"
                size="lg"
                onClick={async () => {
                  await promptInstall();
                  closeInstallGuide();
                }}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full font-black text-sm rounded-2xl min-h-[48px] shadow-md shadow-[#6C5CE7]/25"
              >
                Install DayForge Now
              </Button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Monitor className="w-4 h-4 text-[#6C5CE7]" />
                  <span>Desktop & Browser App Support</span>
                </div>
                <p className="text-slate-500">
                  If the prompt button is unavailable, tap the <strong>Install icon (⊕ / 📥)</strong> in your browser's address bar or menu.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="md"
            onClick={closeInstallGuide}
            className="font-bold"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

