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
      showDefault: false,
      imageResources: [
        'assets/icon/dark.png',
        'assets/icon/light.png'
      ],
      layout: 'single'
    }
  }
};

export default config;