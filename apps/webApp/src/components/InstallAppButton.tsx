import React from 'react';
import { Download, Smartphone } from 'lucide-react';

interface InstallAppButtonProps {
  variant?: 'nav' | 'hero' | 'floating' | 'banner';
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  // Always links to the latest automated GitHub Release APK built by CI/CD
  const downloadUrl =
    import.meta.env.VITE_APK_DOWNLOAD_URL ||
    'https://github.com/Anjan-Kumar-Sahoo/Secure-Save/releases/download/latest/securesave.apk';

  if (variant === 'nav') {
    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-purple-600/20 hover:from-violet-600/35 hover:to-purple-600/35 text-violet-200 hover:text-white text-xs font-semibold shadow-sm transition-all hover:border-violet-400/50 hover:shadow-violet-500/10 active:scale-95 ${className}`}
        title="Download Secure Save Android App (.apk)"
      >
        <Download className="w-3.5 h-3.5 text-vault-accentLight animate-bounce" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">App</span>
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`p-4 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/40 via-purple-900/20 to-violet-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-vault-accentLight shrink-0">
            <Smartphone className="w-5 h-5 text-vault-accentLight" />
          </div>
          <div>
            <p className="text-sm font-semibold text-vault-text">Install Secure Save Mobile App</p>
            <p className="text-xs text-vault-muted">
              Get biometric unlock, offline speed, and native experience on your Android phone.
            </p>
          </div>
        </div>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-xs py-2 px-4 shrink-0 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Android APK</span>
        </a>
      </div>
    );
  }

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-secondary text-xs py-2 px-3 flex items-center gap-2 ${className}`}
    >
      <Download className="w-4 h-4 text-vault-accentLight" />
      <span>Install App (APK)</span>
    </a>
  );
};
