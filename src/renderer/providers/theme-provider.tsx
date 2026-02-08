/**
 * Theme Provider - Applies whitelabel theme at runtime
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WhitelabelConfig, DEFAULT_CONFIG } from '../../config/whitelabel';

interface ThemeContextValue {
  config: WhitelabelConfig;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  config: DEFAULT_CONFIG,
  isLoading: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  config?: WhitelabelConfig;
}

export function ThemeProvider({ children, config: externalConfig }: ThemeProviderProps) {
  const [config, setConfig] = useState<WhitelabelConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use external config if provided, otherwise use default
    const finalConfig = externalConfig ?? DEFAULT_CONFIG;
    setConfig(finalConfig);
    setIsLoading(false);

    // Apply CSS variables
    applyTheme(finalConfig);

    // Update document title
    document.title = finalConfig.appName;
  }, [externalConfig]);

  return (
    <ThemeContext.Provider value={{ config, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Apply theme colors as CSS variables
 */
function applyTheme(config: WhitelabelConfig): void {
  const root = document.documentElement;
  const { theme } = config;

  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-primary-dark', theme.primaryDarkColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--color-background', theme.backgroundColor);
  root.style.setProperty('--color-surface', theme.surfaceColor);
  root.style.setProperty('--color-surface-light', theme.surfaceLightColor);
  root.style.setProperty('--color-text', theme.textColor);
  root.style.setProperty('--color-text-muted', theme.textMutedColor);
  root.style.setProperty('--color-accent', theme.accentColor);
  root.style.setProperty('--color-success', theme.successColor);
  root.style.setProperty('--color-warning', theme.warningColor);
  root.style.setProperty('--color-error', theme.errorColor);
}

/**
 * Hook to get feature flags
 */
export function useFeatureFlags() {
  const { config } = useTheme();
  return config.features;
}

/**
 * Hook to get branding info
 */
export function useBranding() {
  const { config } = useTheme();
  return config.branding;
}
