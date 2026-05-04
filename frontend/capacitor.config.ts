import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.historialgo.app',
  appName: 'Historial-GO',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Geliştirme sırasında canlı yenileme için aşağıdaki satırı açın (IP'nizi yazın):
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f4f0e8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#c9a227',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#f4f0e8',
    },
  },
};

export default config;
