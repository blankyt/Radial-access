# Radial Access - Native Windows Python Desktop App

A lightning-fast, native Windows radial menu and quick launcher powered by **PyQt6** and **pynput**.

It runs natively on your Windows desktop — completely outside the web browser:
- 🎯 **Summon Anywhere**: Press `Alt + Space` (or your customized hotkey) anywhere across Windows to spawn the radial wheel centered directly under your mouse cursor.
- ⚡ **Mouse-Flick Gestures**: Flick the cursor quickly in the direction of an item to activate it instantly without clicking.
- 📁 **Submenus & Folders**: Click or flick into folders (e.g., Documents, Downloads, C:\) or sub-tool wheels with smooth transition and Back navigation.
- 🚀 **Real Windows Execution**: Launches `.exe` files, opens URLs in default browser, opens folders in Windows File Explorer, and runs PowerShell/CMD scripts.
- 🔔 **System Tray Integration**: Background tray icon with one-click summoning, config reloading, and direct `config.json` editing.
- 📦 **Compile to .EXE**: Turn it into a standalone portable `RadialAccess.exe` with one click.

---

## 🚀 Quick Start (One-Click)

### Option 1: Run with Batch Script (Easiest)
1. Double-click **`run.bat`**.
2. It automatically verifies Python, installs dependencies (`PyQt6`, `pynput`), and starts the overlay.
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

## 🛠️ Build Standalone `RadialAccess.exe`
To package the app into a single `.exe` that runs without needing Python installed on the target machine:

1. Double-click **`build_exe.bat`** (or run `pip install pyinstaller && pyinstaller --noconsole --onefile main.py`).
2. Your portable executable will be created at:
   ```
   dist\RadialAccess.exe
   ```

### Run on Windows Startup (Optional)
To have Radial Access start whenever your PC turns on:
1. Press `Win + R`, type **`shell:startup`**, and hit Enter.
2. Create a shortcut to `dist\RadialAccess.exe` and paste it into the startup folder.

---

## ⚙️ Customization (`config.json`)

Edit `config.json` directly (or right-click the system tray icon and click **Edit config.json**):

### Item Schema
```json
{
  "id": "my_app",
  "label": "My App",
  "icon": "🚀",
  "color": "#38bdf8",
  "type": "command",       // "url" | "folder_path" | "command" | "system" | "sub_menu"
  "payload": "calc.exe",
  "description": "Quick description"
}
```

### Supported Action Types:
- **`url`**: Opens link in your default browser (e.g. `"https://github.com"`).
- **`folder_path`**: Opens folder in Windows File Explorer (e.g. `"%USERPROFILE%\\Downloads"` or `"D:\\Projects"`).
- **`command`**: Runs any Windows command or launches an `.exe` (e.g. `"code ."` or `"notepad.exe"`).
- **`system`**: Built-in Windows shortcuts: `"calc"`, `"notepad"`, `"taskmgr"`, `"screenshot"`, `"lock"`.
- **`sub_menu`**: Opens a child radial wheel with nested items in `"children": [...]`.

### Settings:
- `"hotkey"`: `<alt>+<space>`, `<ctrl>+<space>`, or `<alt>+q`.
- `"flick_gestures_enabled"`: `true` / `false`.
- `"flick_threshold_speed"`: Flick sensitivity threshold (default: `450.0`).
- `"close_on_action"`: `true` to auto-hide after launching an item.
