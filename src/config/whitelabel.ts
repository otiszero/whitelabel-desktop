/**
 * Whitelabel Configuration Types and Loader
 */

export interface ThemeConfig {
  primaryColor: string;
  primaryDarkColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  surfaceLightColor: string;
  textColor: string;
  textMutedColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
}

export interface BrandingConfig {
  logoPath: string;
  iconPath: string;
  companyName: string;
  tagline: string;
  supportEmail: string;
  websiteUrl: string;
}

export interface FeatureFlags {
  enabledChains: ('btc' | 'eth' | 'xrp' | 'tron')[];
  defaultChain: 'btc' | 'eth' | 'xrp' | 'tron';
  showAboutPage: boolean;
  autoLockTimeout: number;
  maxMnemonicWords: 12 | 24;
}

export interface WhitelabelConfig {
  appName: string;
  appId: string;
  version: string;
  theme: ThemeConfig;
  branding: BrandingConfig;
  features: FeatureFlags;
}

// Default configuration
export const DEFAULT_CONFIG: WhitelabelConfig = {
  appName: 'AirGap Wallet',
  appId: 'com.whitelabel.airgap-wallet',
  version: '1.0.0',
  theme: {
    primaryColor: '#3B82F6',
    primaryDarkColor: '#2563EB',
    secondaryColor: '#6366F1',
    backgroundColor: '#0F172A',
    surfaceColor: '#1E293B',
    surfaceLightColor: '#334155',
    textColor: '#F1F5F9',
    textMutedColor: '#94A3B8',
    accentColor: '#10B981',
    successColor: '#22C55E',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
  },
  branding: {
    logoPath: './assets/logo.svg',
    iconPath: './assets/icon.png',
    companyName: 'AirGap Wallet',
    tagline: 'Offline • Secure • Private',
    supportEmail: 'support@example.com',
    websiteUrl: 'https://example.com',
  },
  features: {
    enabledChains: ['btc', 'eth', 'xrp', 'tron'],
    defaultChain: 'btc',
    showAboutPage: true,
    autoLockTimeout: 300000,
    maxMnemonicWords: 24,
  },
};

/**
 * Validate theme color contrast (basic validation)
 */
export function validateThemeContrast(theme: ThemeConfig): string[] {
  const errors: string[] = [];

  // Simple luminance check (would need proper WCAG calculation for production)
  const lightColors = ['textColor', 'accentColor', 'successColor'];
  const darkColors = ['backgroundColor', 'surfaceColor'];

  // Basic check that text colors are light and bg colors are dark
  for (const key of lightColors) {
    const color = theme[key as keyof ThemeConfig];
    if (color && !isLightColor(color)) {
      errors.push(`${key} should be a light color for good contrast`);
    }
  }

  for (const key of darkColors) {
    const color = theme[key as keyof ThemeConfig];
    if (color && isLightColor(color)) {
      errors.push(`${key} should be a dark color for good contrast`);
    }
  }

  return errors;
}

function isLightColor(hex: string): boolean {
  // Simple luminance check
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Merge partial config with defaults
 */
export function mergeConfig(partial: Partial<WhitelabelConfig>): WhitelabelConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    theme: { ...DEFAULT_CONFIG.theme, ...partial.theme },
    branding: { ...DEFAULT_CONFIG.branding, ...partial.branding },
    features: { ...DEFAULT_CONFIG.features, ...partial.features },
  };
}
