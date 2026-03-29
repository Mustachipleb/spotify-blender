declare global {
  interface Window {
    env?: {
      BACKEND_URL?: string;
    };
  }
}

export interface AppConfig {
  BACKEND_URL: string;
}

export function getAppConfig(): AppConfig {
  return {
    BACKEND_URL: process!.env!.BACKEND_URL!
  };
}
