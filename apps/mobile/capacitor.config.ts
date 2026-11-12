import { CapConfig } from '@capacitor/cli';

const config: CapConfig = {
  appId: 'com.securesave.app',
  appName: 'Secure Save',
  webDir: 'dist',
  bundledWebAssets: false,
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