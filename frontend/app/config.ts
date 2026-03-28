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
  if (typeof window === "undefined") {
    // During SSR, we return a default. This is because window.env is not available.
    // However, the important URLs for redirecting the user happen on the client.
    return {
      BACKEND_URL: "",
    };
  }
  
  // Return window.env if present, falling back to a default.
  return {
    BACKEND_URL: window.env!.BACKEND_URL ?? '',
  };
}
