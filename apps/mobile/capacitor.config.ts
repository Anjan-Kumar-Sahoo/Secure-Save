import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.securesave.app',
  appName: 'Secure Save',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0B0D12'
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#070817',
      showSpinner: false,
      androidSplashResourceName: 'splash'
    }
  }
};

export default config;