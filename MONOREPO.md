# Logos Notes Exporter - Monorepo Setup and Verification

## ✅ Configuration Elements Working Correctly

### PNPM Workspace Configuration

```yaml
# pnpm-workspace.yaml ✅
packages:
  - packages/*
```

### Package Manager Configuration

- Root package.json correctly specifies `"packageManager": "pnpm@10.12.1"`
- All packages have proper `"type": "module"` where needed

### Electron Webpack Setup

- Proper TypeScript webpack configurations
- Correct handling of native modules (better-sqlite3)
- Tailwind CSS 4 integration working correctly

### Monorepo Scripts

- Build scripts properly filter packages
- Development scripts correctly configured

## 📋 Fresh Setup Instructions

### Prerequisites

- **Node.js** 18.0.0 or higher
- **PNPM** 10.12.1 or higher
- **Bun** 1.0.0 or higher (for CLI package)

### Step-by-Step Setup After Cloning from GitHub

#### 1. Clone and Navigate

```bash
git clone https://github.com/agape-apps/logos-notes-exporter.git
cd logos-notes-exporter
```

#### 2. Install PNPM and verify (if not already installed)

https://pnpm.io/installation

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm --version
```

#### 3. Clean Previous Installations

```bash
# Remove any existing node_modules and lock files
rm pnpm-lock.yaml
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf packages/*/dist
rm -rf packages/*/.webpack 
```

#### 4. Install Dependencies

```bash
# Install all dependencies across the monorepo
pnpm install

# This will:
# - Install root dependencies
# - Install dependencies for all workspace packages
# - Link workspace packages together
# - Build necessary native modules
```

#### 5. Build Core Package First

```bash
# Build the core library (required by other packages)
pnpm run build:core
```

#### 3. 4. and 5. ALL IN ONE STEP

```bash
pnpm reinstall
```

#### 6. Verify Installation

**Test CLI Package:**

```bash
# Navigate to CLI package and test
cd packages/cli
pnpm run dev --help
cd ../..
```

**Test Electron Package:**

```bash
# Navigate to Electron package and test
cd packages/electron
pnpm start
```

#### 7. Development Workflow

**Start Electron App:**

```bash
# From root directory
pnpm start
```

**Build All Packages:**

```bash
# From root directory
pnpm run build
```

**Clean Build Artifacts:**

```bash
# From root directory
pnpm run clean
```

### Troubleshooting

#### If PNPM Install Fails:

```bash
# Clear PNPM cache
pnpm store prune

# Remove lock file and reinstall
rm pnpm-lock.yaml
pnpm install
```

#### If Electron App Won't Start:

```bash
# Rebuild native modules
cd packages/electron
pnpm run rebuild
```

#### If Better-SQLite3 Issues:

```bash
# Force rebuild of native modules
cd packages/electron
npx electron-rebuild
```

#### If TypeScript Build Errors:

```bash
# Clean TypeScript build cache
rm -rf packages/*/dist
pnpm run build:core
```

### Development Environment Verification

After setup, verify everything works:

1. **Core Package**: `pnpm run build:core` should complete without errors
2. **CLI Package**: `cd packages/cli && pnpm run dev --help` should show help text
3. **Electron Package**: `cd packages/electron && pnpm start` should open the app

### Package Dependencies Summary

**Root Level:**

- TypeScript 5.0.0
- Better-SQLite3 (for native module handling)

**Core Package (@logos-notes-exporter/core):**

- Bun runtime
- fast-xml-parser
- YAML parser

**CLI Package (@logos-notes-exporter/cli):**

- Depends on @logos-notes-exporter/core
- Bun runtime

**Electron Package:**

- Depends on @logos-notes-exporter/core
- Electron 37.2.1
- React 18.3.1
- Tailwind CSS 4.1.11
- Radix UI components
- Better-SQLite3
- Zustand for state management

### Notes

- The monorepo uses **PNPM workspaces** for dependency management
- **Bun** is used as the runtime for CLI operations (faster SQLite operations)
- **Node.js** is used for Electron app
- **TypeScript** is used throughout with strict typing
- **Native modules** (better-sqlite3) are properly handled in Electron packaging

### Next Steps After Setup

1. Fix the configuration issues mentioned above
2. Run `pnpm install` to update workspace references
3. Test both CLI and Electron applications
4. Commit the configuration fixes
