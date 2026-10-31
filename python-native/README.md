# Radial Access - Native Windows Python Desktop App

A lightning-fast, native Windows radial menu and quick launcher powered by **PyQt6** and **pynput**.

It runs natively on your Windows desktop — completely outside the web browser:
- 🎯 **Summon Anywhere**: Press `Alt + Space` (or your customized hotkey) anywhere across Windows to spawn the radial wheel centered directly under your mouse cursor.
- ⚡ **Mouse-Flick Gestures**: Flick the cursor quickly in the direction of an item to activate it instantly without clicking.
- 📁 **Submenus & Folders**: Click or flick into folders (e.g., Documents, Downloads, C:\) or sub-tool wheels with smooth transition and Back navigation.
- 🚀 **Real Windows Execution**: Launches `.exe` files, opens URLs in default browser, opens folders in Windows File Explorer, and runs PowerShell/CMD scripts.
- 🧠 **Smart Memory Management**: Idles at ~25–35 MB RAM. Halts animation timers when hidden, caches geometric painter paths, and trims physical working set memory.
- 🛡️ **Crash Guard & Safe Mode**: Automatically detects abnormal shutdown via `.crash_guard`, captures unhandled errors to `crash.log`, and boots into a safe diagnostic fallback mode with `--safe-mode`.
- ⚙️ **User Settings Window**: Dedicated tabbed preferences window accessible via System Tray, Tray double-click, center wheel hub click, or `Ctrl+,` / `Ctrl+Alt+S`.
- 📦 **Compile to .EXE**: Turn it into a standalone portable `RadialAccess.exe` with one click.

---

## 🚀 Quick Start (One-Click)

### Option 1: Run with Batch Script (Easiest)
1. Double-click **`run.bat`**.
2. It automatically verifies Python, installs dependencies (`PyQt6`, `pynput`, `pyinstaller`), and starts the overlay.
3. Press **`Alt + Space`** anywhere in Windows to summon the wheel!

---

### Option 2: Run via Command Prompt / PowerShell
```bash
# 1. Navigate to this folder
cd python-native

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch the native app
python main.py
```

---

## 🛡️ Safe Mode & Crash Recovery

If Radial Access experiences an unexpected crash or bad configuration:
- The app automatically logs the traceback and system details to **`crash.log`**.
- An emergency dialog prompts you to restart in **Safe Mode**.
- You can also force Safe Mode at any time from terminal:
  ```bash
  python main.py --safe-mode
  # or
  run.bat --safe-mode
  ```
- To restore factory default configuration:
  ```bash
  python main.py --reset-config
  ```

---

## ⚙️ Easy Access to User Settings

The preferences window can be opened at any time:
1. **System Tray Menu**: Right-click the tray icon -> **"⚙️ Settings & Preferences (Ctrl+,)"**
2. **Double-Click**: Double-click the tray icon in the Windows taskbar.
3. **Radial Center Hub**: Right-click the center hub of the radial menu.
4. **Global Hotkey**: Press **`Ctrl + Alt + S`** (or `Ctrl + ,` when the wheel is open).

The Settings dialog features 6 comprehensive tabs:
- **General**: App Name, Summon Hotkey, Close on Action, Sound Effects, Windows Startup.
- **Gestures & Flick**: Flick speed threshold, Minimum distance, Hover tooltip dwell delay.
- **Appearance & Theme**: Presets (Obsidian, Cyberpunk, Nordic, Emerald, Amber), Radius sliders, Deadzone slider.
- **Slots & Items**: Slot viewer and direct JSON notepad launcher.
- **Performance & Memory**: Live Working Set memory meter, manual GC trigger, memory trimmer, frame rate limiter (60 FPS vs 30 FPS power saver).
- **Safe Mode & Diagnostics**: Safe mode status, view/clear `crash.log`, backup config, restore factory defaults.

---

## 🛠️ Build Standalone `RadialAccess.exe`
To package the app into a single `.exe` that runs without needing Python installed on the target machine:

1. Double-click **`build_exe.bat`** (or run `pip install pyinstaller && pyinstaller --noconsole --onefile main.py`).
2. Your portable executable will be created at:
   ```
   dist\RadialAccess.exe
   ```

---

## 📄 License
Apache-2.0 License.
