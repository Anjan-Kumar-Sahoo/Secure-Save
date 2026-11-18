import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Smartphone,
  Apple,
  Share,
  PlusSquare,
  Sparkles,
  ExternalLink,
  X,
  CheckCircle2,
  Shield,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface InstallAppButtonProps {
  variant?: 'nav' | 'hero' | 'floating' | 'banner';
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(ua);
      if (isAndroid) {
        setActiveTab('android');
      } else {
        setActiveTab('ios');
      }
    }
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const apkDownloadUrl =
    import.meta.env.VITE_APK_DOWNLOAD_URL ||
    'https://github.com/Anjan-Kumar-Sahoo/Secure-Save/releases/download/latest/securesave.apk';

  const ipaDownloadUrl =
    import.meta.env.VITE_IPA_DOWNLOAD_URL ||
    'https://github.com/Anjan-Kumar-Sahoo/Secure-Save/releases/download/latest/securesave.ipa';

  const modalContent = isModalOpen && mounted ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="glass-surface w-full max-w-lg p-5 sm:p-7 rounded-3xl border border-violet-500/30 shadow-2xl relative my-auto max-h-[90vh] flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/30 border border-violet-500/30 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Secure Save Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="min-w-0">
              <h3 id="install-modal-title" className="font-display font-bold text-base sm:text-lg text-white truncate">
                Install Secure Save
              </h3>
              <p className="text-xs text-vault-muted">Available for iPhone, iPad & Android</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 rounded-xl text-vault-muted hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 my-4 shrink-0">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-violet-600/35 to-purple-600/35 border border-violet-400/60 text-white shadow-lg shadow-violet-900/30'
                : 'bg-white/[0.03] border border-white/5 text-vault-muted hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Apple className="w-4 h-4 text-white shrink-0" />
            <span className="truncate">iPhone / iPad (iOS)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-emerald-600/35 to-teal-600/35 border border-emerald-400/60 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-white/[0.03] border border-white/5 text-vault-muted hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Android (.apk)</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5">
          {/* TAB CONTENT: iOS / iPad */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Method A: Instant Home Screen PWA */}
              <div className="p-4 rounded-2xl bg-black/40 border border-violet-500/25">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/25 text-violet-300 font-bold">
                    RECOMMENDED • ZERO SETUP
                  </span>
                  <span className="text-[10px] font-mono text-vault-muted">Full Screen</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Install via Safari Home Screen</h4>
                <ol className="space-y-2 text-xs text-vault-muted leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Open <strong>securesave.mraks.dev</strong> in Safari and tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-violet-300" />.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Scroll down in the action sheet and select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-violet-300" />.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>Add</strong> in the top corner. Secure Save will launch like a native application with offline support.</span>
                  </li>
                </ol>
              </div>

              {/* Method B: Native iOS IPA */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    Native iOS IPA Package
                  </h4>
                  <p className="text-[11px] text-vault-muted mt-0.5 leading-snug">
                    For Sideloading (AltStore, SideStore, Scarlet, or TrollStore).
                  </p>
                </div>
                <a
                  href={ipaDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .IPA</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB CONTENT: Android */}
          {activeTab === 'android' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/25">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-bold">
                    DIRECT DOWNLOAD
                  </span>
                  <span className="text-[10px] font-mono text-vault-muted">Universal APK</span>
                </div>
                <h4 className="text-sm font-bold text-white">Secure Save Android APK</h4>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">
                  Install directly on any Android phone, tablet, or emulator. Built automatically via GitHub Actions.
                </p>

                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full mt-4 text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  <span>Download securesave.apk</span>
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/5 flex items-start gap-2.5 text-[11px] text-vault-muted leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  After download completes, tap the file in your notification shade and allow <strong>"Install from this source"</strong> if prompted by Android.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-vault-muted font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-vault-success" />
            Zero-Knowledge AES-256-GCM
          </span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* 1. Header Navigation Button */}
      {variant === 'nav' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-purple-600/20 hover:from-violet-600/35 hover:to-purple-600/35 text-violet-200 hover:text-white text-xs font-semibold shadow-sm transition-all hover:border-violet-400/50 hover:shadow-violet-500/10 active:scale-95 shrink-0 ${className}`}
          title="Install Secure Save on iOS, iPadOS, or Android"
        >
          <Download className="w-3.5 h-3.5 text-vault-accentLight animate-bounce shrink-0" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden font-medium">Install</span>
        </button>
      )}

      {/* 2. Banner Variant */}
      {variant === 'banner' && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/40 via-purple-900/20 to-violet-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full ${className}`}
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/30 border border-violet-500/30 flex items-center justify-center text-vault-accentLight shrink-0 shadow-lg">
              <Smartphone className="w-5 h-5 text-vault-accentLight" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <p className="text-sm font-semibold text-vault-text">Install Secure Save</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  App Available
                </span>
              </div>
              <p className="text-xs text-vault-muted mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                Enjoy offline speed, instant biometric unlocking, and a full standalone app experience.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs py-2.5 px-4 w-full md:w-auto shrink-0 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* 3. Hero / Default Button Variant */}
      {variant !== 'nav' && variant !== 'banner' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`btn-secondary text-xs sm:text-sm py-2.5 sm:py-3 px-4 sm:px-5 flex items-center justify-center gap-2 active:scale-95 transition-transform ${className}`}
        >
          <Download className="w-4 h-4 text-vault-accentLight shrink-0" />
          <span>Install App</span>
        </button>
      )}

      {/* Render Dialog via React Portal to document.body, completely outside navbar hierarchy */}
      {mounted && typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
