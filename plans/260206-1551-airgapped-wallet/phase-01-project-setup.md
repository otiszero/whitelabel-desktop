# Phase 1: Project Setup & Security Foundation

## Context
First phase of air-gapped wallet. Establishes Electron scaffolding with React/TypeScript and implements network blocking - the core security feature.

## Overview
- Scaffold Electron 28+ with React 18 + TypeScript + Vite
- Implement complete network isolation
- Configure strict CSP
- Set up cross-platform build pipeline

## Requirements
- Zero network connectivity (air-gap)
- TypeScript strict mode
- Hot reload for development
- Builds for Windows (exe), macOS (dmg), Linux (AppImage)

## Architecture

### Main Process Structure
```
src/main/
├── index.ts              # App lifecycle, window creation
├── network-blocker.ts    # Request interception
├── preload.ts            # Secure context bridge
└── ipc-handlers.ts       # IPC message handlers
```

### Network Blocking Layers
1. **Session WebRequest**: Block all http/https/ws at request level
2. **Command Line Flags**: Disable background networking
3. **CSP Meta Tag**: `connect-src 'none'`
4. **Node Integration**: Disabled (prevents require('http'))

## Implementation Steps

### 1.1 Initialize Project (2h)
```bash
mkdir airgap-wallet && cd airgap-wallet
npm init -y
npm install electron electron-builder vite @vitejs/plugin-react
npm install react react-dom typescript tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom @types/node
```

package.json scripts:
```json
{
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "start": "electron ."
  }
}
```

### 1.2 Electron Main Process (4h)
**src/main/index.ts**
- Create BrowserWindow with security options
- Load from Vite dev server (dev) or file:// (prod)
- Configure webPreferences: contextIsolation=true, nodeIntegration=false

**src/main/network-blocker.ts**
```typescript
export function blockAllNetworkRequests(session: Session): void {
  session.webRequest.onBeforeRequest((details, callback) => {
    const blocked = details.url.startsWith('http') ||
                   details.url.startsWith('ws');
    callback({ cancel: blocked });
  });
}
```

### 1.3 Preload Script (2h)
**src/main/preload.ts**
- Expose safe IPC methods via contextBridge
- No direct Node.js access to renderer
- Define typed API: keystore, signing, settings

### 1.4 React Application Shell (3h)
**src/renderer/App.tsx**
- Router setup (react-router-dom)
- Layout with sidebar navigation
- Theme provider for whitelabel

**src/renderer/index.html**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'none';
  img-src 'self' data: blob:;
  media-src 'self' blob:;
">
```

### 1.5 Tailwind Setup (1h)
- tailwind.config.js with custom colors for whitelabel
- PostCSS integration with Vite
- Base styles in index.css

### 1.6 Build Configuration (4h)
**electron-builder.yml**
```yaml
appId: com.whitelabel.airgap-wallet
productName: AirGap Wallet
directories:
  output: release
files:
  - dist/**/*
  - package.json
mac:
  target: [dmg, zip]
  category: public.app-category.finance
win:
  target: [nsis, portable]
linux:
  target: [AppImage, deb]
```

## Todo Checklist
- [ ] Initialize npm project with dependencies
- [ ] Create tsconfig.json (strict mode)
- [ ] Create vite.config.ts for React + Electron
- [ ] Implement src/main/index.ts (window creation)
- [ ] Implement src/main/network-blocker.ts
- [ ] Implement src/main/preload.ts
- [ ] Create src/renderer/App.tsx shell
- [ ] Configure CSP in index.html
- [ ] Setup Tailwind CSS
- [ ] Configure electron-builder.yml
- [ ] Test network blocking (DevTools Network tab)
- [ ] Test builds on all 3 platforms

## Success Criteria
1. `npm run dev` starts Electron with React hot reload
2. Network tab shows 0 requests, fetch() fails with blocked error
3. `npm run build` produces installers for Win/Mac/Linux
4. Console logs "Network request blocked" for any HTTP attempt

## Risks
| Risk | Mitigation |
|------|------------|
| Vite HMR uses WebSocket | Allow ws://localhost only in dev mode |
| Native modules need rebuild | Use electron-rebuild in postinstall |

## Estimated Effort: 16h
