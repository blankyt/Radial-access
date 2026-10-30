# Radial Access

An ultra-responsive, customizable radial shortcut wheel for instant tool access, nested folder navigation, and workflow execution.

## Features

- **Cursor-Centric Trigger**: Spawns directly at your mouse pointer or fixed center.
- **Dynamic Slots**: Add, reorder, and configure as many radial slots as needed.
- **Nested Folder Submenus**: Expand nested folders directly in the radial wheel.
- **Tactile Hover Ripples**: Smooth interactive feedback with fluid physics.
- **Flick Gestures & Tooltips**: Quick-gesture selection and detailed inspection modals.
- **Background Workspace Manager**: Configure custom logos, brand names, and items cleanly from the dedicated background interface.
- **Native Windows Desktop (Python/PyQt6)**: Runs directly on your Windows desktop with global `Alt+Space` hotkey, system tray icon, and standalone `.exe` packaging!

---

## 🪟 Run Natively on Windows (Python Desktop App)

If you want Radial Access to run **directly on your Windows desktop** (outside of the browser) with global hotkey `Alt+Space`:

1. Navigate to the `python-native` directory:
   ```cmd
   cd python-native
   ```
2. **One-Click Run**: Double-click **`run.bat`**
   - It automatically checks Python 3, sets up requirements (`PyQt6`, `pynput`), and starts the overlay.
3. **One-Click Standalone .EXE**: Double-click **`build_exe.bat`**
   - Packages `RadialAccess.exe` into `python-native/dist/RadialAccess.exe` so you can run it anywhere without opening Python or a terminal.
4. Press **`Alt + Space`** anywhere in Windows to summon the wheel right at your mouse cursor!

---

## Getting Started Locally

### 1. Prerequisites
Ensure you have Node.js installed on your machine:
- **Node.js**: v18.18.0 or newer (Node.js 20 LTS or Node.js 22 LTS recommended)
- Check your version:
  ```bash
  node -v
  npm -v
  ```
  *(If you do not have Node.js installed, download it from [nodejs.org](https://nodejs.org/)).*

---

### 2. Installation
Open your terminal in the cloned repository directory:

```bash
cd radial-access
npm install
```

> **Note:** If you use alternative package managers:
> - **pnpm**: `pnpm install`
> - **yarn**: `yarn install`
> - **bun**: `bun install`

---

### 3. Run Development Server
Start the local Vite development server:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```
*(If port 3000 is occupied, Vite will automatically prompt or select the next open port like 3001).*

---

### 4. Build for Production
To generate an optimized production bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

### 5. Common Troubleshooting

- **Node Version Error**: Ensure you are on Node.js 18.18+ or 20+ since React 19 and Tailwind CSS v4 require modern Node runtimes.
- **Dependency Conflicts**: If you encounter any installation warnings with peer dependencies, run:
  ```bash
  npm install --legacy-peer-deps
  ```
- **Port In Use**: If port 3000 is in use by another app, you can pass another port:
  ```bash
  npx vite --port 3001
  ```
- **Fresh Reinstall**:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
