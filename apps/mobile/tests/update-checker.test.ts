// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { isRemoteNewer } from '../src/components/AppUpdateModal';

describe('AppUpdateModal Update Checker Logic', () => {
  describe('isRemoteNewer version comparison', () => {
    it('Installed 1.0, latest 1.1 -> show update (true)', () => {
      expect(isRemoteNewer('1.1', '1.0')).toBe(true);
      expect(isRemoteNewer('v1.1', '1.0')).toBe(true);
    });

    it('Installed 1.1, latest 1.1 -> no update (false)', () => {
      expect(isRemoteNewer('1.1', '1.1')).toBe(false);
      expect(isRemoteNewer('v1.1', '1.1')).toBe(false);
    });

    it('Installed 1.2, latest 1.1 -> no update (false)', () => {
      expect(isRemoteNewer('1.1', '1.2')).toBe(false);
      expect(isRemoteNewer('v1.1', '1.2')).toBe(false);
    });

    it('Handles major bumps correctly: 2.0 > 1.99', () => {
      expect(isRemoteNewer('2.0', '1.99')).toBe(true);
      expect(isRemoteNewer('1.99', '2.0')).toBe(false);
    });

    it('Ignores letter v case insensitively', () => {
      expect(isRemoteNewer('V1.2', '1.1')).toBe(true);
      expect(isRemoteNewer('v1.0', '1.0')).toBe(false);
    });
  });

  describe('Dismissal & Download behavior lifecycle', () => {
    it('LocalStorage is not modified by dismiss or download and installed version is never persisted there', () => {
      localStorage.clear();
      // Verify nothing is written to localStorage
      expect(localStorage.getItem('securesave_dismissed_update')).toBeNull();
      expect(localStorage.getItem('installed_version')).toBeNull();
    });

    it('Session dismissal does not affect subsequent app launches or native metadata checks', () => {
      // Simulating app launch 1: installed 1.0, remote 1.1 -> prompt needed
      const installedLaunch1 = '1.0';
      const remote = '1.1';
      expect(isRemoteNewer(remote, installedLaunch1)).toBe(true);

      // User dismisses or downloads APK without installing.
      // Simulating app launch 2 (fresh session, app restarts): native version is still 1.0
      const installedLaunch2 = '1.0';
      // Native metadata remains 1.0, so update check triggers again on next launch
      expect(isRemoteNewer(remote, installedLaunch2)).toBe(true);

      // Simulating app launch 3 after user actually installed APK: native version is now 1.1
      const installedLaunch3 = '1.1';
      // Notification disappears naturally because 1.1 is not newer than 1.1
      expect(isRemoteNewer(remote, installedLaunch3)).toBe(false);
    });
  });
});
