import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.securesave.app',
  appName: 'Secure Save',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#090B12',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#090B12',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;
