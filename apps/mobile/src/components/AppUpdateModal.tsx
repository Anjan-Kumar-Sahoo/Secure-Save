import React, { useState, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { App } from '@capacitor/app';

// In-memory session dismissal tracker so dismissing does NOT prompt again during this single app session,
// but leaves localStorage completely untouched so on next app launch, the native metadata is re-checked cleanly.
let sessionDismissedVersion: string | null = null;
let hasCheckedThisSession = false;

export interface AppVersionInfo {
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl: string;
}

/**
 * Compare version strings numerically (e.g. "1.0", "1.1", "1.2", "1.99", "2.0")
 * Returns true if remoteVersion is strictly greater than installedVersion
 */
export function isRemoteNewer(remoteVersion: string, installedVersion: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const rParts = clean(remoteVersion).split('.').map((p) => parseInt(p, 10) || 0);
  const iParts = clean(installedVersion).split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(rParts.length, iParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] ?? 0;
    const inst = iParts[i] ?? 0;
    if (r > inst) return true;
    if (r < inst) return false;
  }
  return false;
}

export const AppUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Avoid spamming GitHub API repeatedly in a single session
    if (hasCheckedThisSession) {
      return;
    }
    hasCheckedThisSession = true;

    let isMounted = true;

    const checkAppVersion = async () => {
      let currentVersion = '';

      // 1. Read real installed Android version from native Capacitor App metadata
      try {
        const info = await App.getInfo();
        if (info && info.version) {
          currentVersion = info.version.trim();
        }
      } catch (err) {
        console.debug('Native App.getInfo() not available (e.g. running in web browser):', err);
      }

      // If we cannot determine native version (e.g. pure web view), do not guess or prompt false updates
      if (!currentVersion) {
        return;
      }

      if (isMounted) {
        setInstalledVersion(currentVersion);
      }

      // 2. Fetch latest stable GitHub release from repository
      try {
        const ghRes = await fetch('https://api.github.com/repos/Anjan-Kumar-Sahoo/Secure-Save/releases/latest', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SecureSaveApp',
          },
        });

        if (!ghRes.ok) {
          // GitHub API offline or rate-limited: fail silently, do not disturb user
          return;
        }

        const ghData = await ghRes.json();

        // Must be a published, non-draft, non-prerelease
        if (ghData.draft || ghData.prerelease) {
          return;
        }

        const rawTag = (ghData.tag_name || '').trim();
        const remoteVersion = rawTag.replace(/^v/i, '').trim();

        if (!remoteVersion) return;

        // In-memory dismissal check for this single app session
        if (sessionDismissedVersion === remoteVersion) {
          return;
        }

        // Compare strictly: is remote release genuinely newer than native installed version?
        const hasNewRelease = isRemoteNewer(remoteVersion, currentVersion);

        if (hasNewRelease && isMounted) {
          // Find the exact securesave.apk asset attached to this release
          const apkAsset = ghData.assets?.find((a: any) =>
            typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
          );

          const downloadUrl = apkAsset?.browser_download_url ||
            `https://github.com/Anjan-Kumar-Sahoo/Secure-Save/releases/download/${rawTag}/securesave.apk`;

          setUpdateInfo({
            latestVersion: remoteVersion,
            releaseNotes: ghData.body || `Version ${remoteVersion} is now available.`,
            downloadUrl,
          });
          setIsOpen(true);
        }
      } catch (err) {
        // Network failure / offline: fail silently, do not show false update alerts
        console.debug('Update check skipped (network error or offline):', err);
      }
    };

    const timer = setTimeout(checkAppVersion, 1200);
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
    // Mark temporary in-memory session dismissal so user is not prompted again while app stays open
    sessionDismissedVersion = updateInfo.latestVersion;

    try {
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
    }, 2500);
  };

  const handleCancel = () => {
    // Temporary in-memory dismissal prevents repeated popups during this session only.
    // Does NOT write to localStorage or change installed version comparison.
    if (updateInfo) {
      sessionDismissedVersion = updateInfo.latestVersion;
    }
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
          Version <span className="text-white font-mono font-semibold">v{updateInfo.latestVersion}</span> is ready to install. (You have v{installedVersion})
        </p>

        {/* Release Notes */}
        {updateInfo.releaseNotes && (
          <div className="bg-[#181D33] border border-[#252E4C] rounded-xl p-3 mb-5 text-xs text-vault-muted leading-relaxed max-h-32 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
              What's New:
            </span>
            <div className="whitespace-pre-line">
              {updateInfo.releaseNotes}
            </div>
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


