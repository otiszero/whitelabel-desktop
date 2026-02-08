# Phase 6: Whitelabel & Polish

## Context
Final phase. Implements branding customization system and production polish. Depends on Phase 5 (complete UI).

## Overview
- JSON-based branding configuration
- Runtime theme application
- Build-time asset injection
- Documentation and release prep

## Requirements
- Change branding without code modification
- Support logo, colors, app name, about text
- Apply theme at runtime (no rebuild needed)
- Production-ready builds with signing

## Architecture

### Whitelabel Configuration
```
config/
├── whitelabel.json           # Branding config
└── assets/
    ├── logo.svg              # Main logo
    ├── logo-dark.svg         # Dark mode variant
    ├── icon.png              # App icon (512x512)
    └── splash.png            # Loading screen
```

### Configuration Schema
```json
{
  "$schema": "./whitelabel.schema.json",
  "appName": "AirGap Wallet",
  "appId": "com.company.airgap-wallet",
  "version": "1.0.0",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "backgroundColor": "#0F172A",
    "textColor": "#F8FAFC",
    "accentColor": "#10B981",
    "errorColor": "#EF4444",
    "warningColor": "#F59E0B"
  },
  "branding": {
    "logoPath": "./assets/logo.svg",
    "iconPath": "./assets/icon.png",
    "companyName": "Company Inc",
    "supportEmail": "support@company.com",
    "websiteUrl": "https://company.com"
  },
  "features": {
    "enabledChains": ["btc", "eth", "xrp", "tron"],
    "defaultChain": "btc",
    "showAboutPage": true
  }
}
```

## Implementation Steps

### 6.1 Whitelabel Configuration Loader (3h)
**src/config/whitelabel-loader.ts**

```typescript
import { app } from 'electron';
import path from 'path';

interface WhitelabelConfig {
  appName: string;
  appId: string;
  theme: ThemeConfig;
  branding: BrandingConfig;
  features: FeatureFlags;
}

export function loadWhitelabelConfig(): WhitelabelConfig {
  // Priority: external config > bundled config > defaults
  const externalPath = path.join(app.getPath('userData'), 'whitelabel.json');
  const bundledPath = path.join(__dirname, '../config/whitelabel.json');

  if (fs.existsSync(externalPath)) {
    return JSON.parse(fs.readFileSync(externalPath, 'utf-8'));
  }
  if (fs.existsSync(bundledPath)) {
    return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'));
  }
  return DEFAULT_CONFIG;
}
```

### 6.2 Theme Provider (3h)
**src/renderer/providers/theme-provider.tsx**

```typescript
interface ThemeContext {
  config: WhitelabelConfig;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WhitelabelConfig | null>(null);

  useEffect(() => {
    window.api.config.getWhitelabel().then(setConfig);
  }, []);

  useEffect(() => {
    if (!config) return;

    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', config.theme.primaryColor);
    root.style.setProperty('--color-secondary', config.theme.secondaryColor);
    root.style.setProperty('--color-background', config.theme.backgroundColor);
    root.style.setProperty('--color-text', config.theme.textColor);
    root.style.setProperty('--color-accent', config.theme.accentColor);

    // Update document title
    document.title = config.appName;
  }, [config]);

  return (
    <ThemeContext.Provider value={{ config, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 6.3 Tailwind CSS Variables (2h)
**tailwind.config.js**

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        accent: 'var(--color-accent)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
      }
    }
  }
}
```

### 6.4 Build-Time Asset Injection (2h)
**scripts/inject-branding.js**

Pre-build script to:
1. Copy logo to public/
2. Generate app icons (multiple sizes)
3. Update electron-builder.yml with appId/productName
4. Generate platform-specific assets (icns, ico)

```javascript
const sharp = require('sharp');

async function generateIcons(inputPath, outputDir) {
  const sizes = [16, 32, 64, 128, 256, 512, 1024];
  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size)
      .toFile(path.join(outputDir, `icon-${size}.png`));
  }
}
```

### 6.5 About Page (1h)
**src/renderer/components/about/about-page.tsx**

Display:
- App logo and name
- Version number
- Company info
- Support email (copyable)
- Open-source licenses

### 6.6 Production Polish (2h)

**Error Boundaries**
- Catch React errors, show recovery UI
- Log errors to local file

**Loading States**
- Skeleton screens for async operations
- Progress indicators for signing

**Accessibility**
- Keyboard navigation
- Screen reader labels
- Focus management

### 6.7 Documentation (2h)

**README.md**
- Project overview
- Build instructions
- Whitelabel configuration guide

**docs/whitelabel-guide.md**
- Config schema reference
- Asset requirements
- Theme customization

**docs/security-model.md**
- Air-gap implementation details
- Key storage explanation
- Threat model

## Todo Checklist
- [ ] Create whitelabel.json schema
- [ ] Implement whitelabel-loader.ts
- [ ] Implement ThemeProvider
- [ ] Configure Tailwind CSS variables
- [ ] Create inject-branding.js script
- [ ] Implement About page
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Accessibility audit
- [ ] Write README.md
- [ ] Write whitelabel-guide.md
- [ ] Write security-model.md
- [ ] Test theme switching
- [ ] Test custom branding build
- [ ] Final cross-platform testing

## Success Criteria
1. Change whitelabel.json → UI reflects new branding
2. Custom logo appears in app and OS taskbar
3. All components use theme colors
4. Documentation sufficient for external team deployment
5. No accessibility violations (axe-core audit)

## Risks
| Risk | Mitigation |
|------|------------|
| Icon generation fails | Provide pre-generated fallbacks |
| Theme contrast issues | Validate contrast ratios in loader |

## Estimated Effort: 12h
