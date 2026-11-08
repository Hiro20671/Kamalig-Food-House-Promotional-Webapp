import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, MoreVertical, X, CheckCircle2 } from 'lucide-react';

// Store deferredPrompt globally so route transitions don't lose the browser event
let globalDeferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  globalDeferredPrompt = e;
});

export default function PwaInstallButton({ className = '', variant = 'default' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowGuideModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          className ||
          (variant === 'compact'
            ? 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#23C7DF]/15 hover:bg-[#23C7DF] text-[#23C7DF] hover:text-[#101C28] border border-[#23C7DF]/35 transition-all cursor-pointer'
            : 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#23C7DF] hover:opacity-90 text-[#101C28] shadow-md transition-all cursor-pointer')
        }
        title="Install Kamalig Food House App on Your Phone"
      >
        <Download className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Install App</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#171B20] border-t sm:border border-[#F6C928]/40 p-6 sm:p-8 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/kamalig-logo.png"
                  alt="Kamalig App Icon"
                  className="w-12 h-12 rounded-2xl border border-[#F6C928]"
                />
                <div>
                  <h3 className="font-display font-black text-lg text-white">
                    Install Kamalig App
                  </h3>
                  <p className="text-xs text-[#F6C928] font-bold">
                    Works on Android, iPhone &amp; Desktop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-full bg-[#101C28] text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Add <strong>Kamalig Food House</strong> to your phone’s home screen for 1-tap access to the Digital Menu, Directions, and the Owner CMS Dashboard:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#101C28] border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#F6C928]/15 text-[#F6C928] flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">Android (Chrome / Browser)</p>
                  <p className="text-gray-300">
                    Tap the browser menu icon <strong>(⋮)</strong> in the top corner and select{' '}
                    <strong className="text-[#F6C928]">&ldquo;Install app&rdquo;</strong> or{' '}
                    <strong className="text-[#F6C928]">&ldquo;Add to Home screen&rdquo;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#101C28] border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#23C7DF]/15 text-[#23C7DF] flex-shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">iPhone / iPad (Safari)</p>
                  <p className="text-gray-300">
                    Tap the <strong>Share</strong> button at the bottom of Safari and tap{' '}
                    <strong className="text-[#23C7DF]">&ldquo;Add to Home Screen&rdquo;</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Tip: Once installed, you can manage the entire website from your phone!</span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-xl font-display font-extrabold text-xs bg-[#F6C928] text-[#101C28]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}

