import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';

// Current installed mobile app version
export const CURRENT_APP_VERSION = '1.2.0';
export const CURRENT_VERSION_CODE = 3;

export interface AppVersionInfo {
  latestVersion: string;
  versionCode: number;
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
      try {
        const res = await api.get('/app/version');
        const data: AppVersionInfo = res.data?.data;

        if (!data || !data.latestVersion) return;

        // Check if remote version is newer or remote versionCode is greater
        const hasNewVersion =
          (data.versionCode && data.versionCode > CURRENT_VERSION_CODE) ||
          isNewerVersion(data.latestVersion, CURRENT_APP_VERSION);

        if (hasNewVersion && isMounted) {
          setUpdateInfo(data);
          setIsOpen(true);
        }
      } catch (err) {
        // Silent failure: network errors should not interrupt normal app usage
        console.debug('Update check skipped or offline:', err);
      }
    };

    // Run check after a short delay on mount
    const timer = setTimeout(checkVersion, 1500);
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
    window.open(updateInfo.downloadUrl, '_system');
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
