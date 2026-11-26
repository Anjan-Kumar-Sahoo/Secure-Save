import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';

// Current installed mobile app version
export const CURRENT_APP_VERSION = '1.2.0';
export const CURRENT_VERSION_CODE = 3;

// Injected at compile-time automatically by Vite whenever code is pushed/built
declare const __APP_BUILD_TIME__: string;
export const CURRENT_BUILD_TIMESTAMP = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : '2026-11-26T00:00:00Z';

export interface AppVersionInfo {
  latestVersion: string;
  versionCode?: number;
  releaseNotes?: string;
  downloadUrl: string;
  mandatory?: boolean;
}

/**
 * Compare semantic versions (e.g., '1.3.0' > '1.2.0')
 */
function isNewerVersion(remoteVer: string, currentVer: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map((p) => parseInt(p, 10) || 0);
  const remote = parse(remoteVer);
  const current = parse(currentVer);

  for (let i = 0; i < Math.max(remote.length, current.length); i++) {
    const r = remote[i] || 0;
    const c = current[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export const AppUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      // 1. Try querying backend /api/app/version first
      try {
        const res = await api.get('/app/version');
        const data: AppVersionInfo = res.data?.data;

        if (data && data.latestVersion) {
          const hasNewVersion =
            (data.versionCode && data.versionCode > CURRENT_VERSION_CODE) ||
            isNewerVersion(data.latestVersion, CURRENT_APP_VERSION);

          if (hasNewVersion && isMounted) {
            setUpdateInfo(data);
            setIsOpen(true);
            return;
          }
        }
      } catch {
        // Backend /app/version might not be deployed yet on Vercel; proceed to GitHub check
      }

      // 2. Query GitHub Releases directly (matches your screenshot: github.com/Anjan-Kumar-Sahoo/Secure-Save/releases)
      try {
        const ghRes = await fetch('https://api.github.com/repos/Anjan-Kumar-Sahoo/Secure-Save/releases/tags/latest', {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
        });

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          const apkAsset = ghData.assets?.find((a: any) => a.name === 'securesave.apk');

          if (apkAsset) {
            // Check if GitHub has an APK built after this app was built
            const assetTime = new Date(apkAsset.updated_at).getTime();
            const buildTime = new Date(CURRENT_BUILD_TIMESTAMP).getTime();

            // If GitHub APK is newer than local app build time
            if (assetTime > buildTime && isMounted) {
              setUpdateInfo({
                latestVersion: 'Latest Build',
                releaseNotes: ghData.body || 'New features, performance enhancements, and bug fixes.',
                downloadUrl: apkAsset.browser_download_url || 'https://github.com/Anjan-Kumar-Sahoo/Secure-Save/releases/latest/download/securesave.apk',
              });
              setIsOpen(true);
            }
          }
        }
      } catch (err) {
        console.debug('GitHub release check offline or rate limited:', err);
      }
    };

    // Run check after 1 second on mount
    const timer = setTimeout(checkVersion, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!isOpen || !updateInfo) {
    return null;
  }

  const handleUpdate = () => {
    setIsDownloading(true);
    // Open direct APK download link in external browser/system download manager
    try {
      // Create a temporary anchor element with target="_blank" and rel="noopener noreferrer"
      // This is the most reliable cross-platform way for WebView to hand off APK downloads to the Android Download Manager
      const link = document.createElement('a');
      link.href = updateInfo.downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(updateInfo.downloadUrl, '_system');
    }
    setTimeout(() => {
      setIsDownloading(false);
      setIsOpen(false);
    }, 2000);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-[#121626] border border-[#2A3353] p-6 shadow-2xl text-vault-text relative animate-slideUp">
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-vault-accent/20 border border-vault-accent/40 flex items-center justify-center text-vault-accent mb-4">
          <Sparkles className="w-6 h-6 animate-pulse text-indigo-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-1">
          New Version Available
        </h3>
        <p className="text-xs text-vault-muted mb-4">
          Version <span className="text-white font-mono font-semibold">v{updateInfo.latestVersion}</span> is now available. (You have v{CURRENT_APP_VERSION})
        </p>

        {/* Release Notes */}
        {updateInfo.releaseNotes && (
          <div className="bg-[#181D33] border border-[#252E4C] rounded-xl p-3 mb-5 text-xs text-vault-muted leading-relaxed">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
              What's New:
            </span>
            {updateInfo.releaseNotes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-vault-borderSubtle bg-white/5 hover:bg-white/10 text-vault-muted text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={isDownloading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Opening...' : 'Update Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
