declare global {
  interface Window {
    electron: {
      getScreenInfo: () => Promise<any[]>;
    }
  }
}

export {}; 