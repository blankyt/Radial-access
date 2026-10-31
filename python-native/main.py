#!/usr/bin/env python3
"""
Radial Access - Native Windows Radial Menu & Quick Launcher
Built with PyQt6 & pynput for native Windows desktop environments.

Features:
- Cursor-Centric Spawning: Centers directly on cursor coordinates across monitors.
- Mouse-Flick Gestures: Trigger actions through swift velocity vectors without clicking.
- Robust Memory Management: Slept animation timers when hidden, Win32 working set trimming,
  reusable QPainterPath caching, and periodic garbage collection watchdog.
- Crash Guard & Safe Mode: Global exception logger (crash.log), lockfile detection (.crash_guard),
  corrupt config recovery (.bak), and fail-safe fallback options.
- Dedicated User Settings Window: Tabbed PyQt6 preferences window accessible via System Tray,
  double-click, center hub click, or global shortcut (Ctrl+, / Ctrl+Alt+S).
"""

import sys
import os
import json
import math
import time
import ctypes
import traceback
import webbrowser
import subprocess
import threading
import atexit
import gc
from typing import List, Dict, Any, Optional, Tuple

try:
    from PyQt6.QtCore import Qt, QPoint, QPointF, QRectF, QTimer, pyqtSignal, QObject, QSize
    from PyQt6.QtGui import (
        QPainter, QPainterPath, QColor, QPen, QBrush, QFont,
        QCursor, QIcon, QPixmap, QLinearGradient, QRadialGradient, QFontMetrics
    )
    from PyQt6.QtWidgets import (
        QApplication, QWidget, QSystemTrayIcon, QMenu, QMessageBox, QDialog,
        QVBoxLayout, QHBoxLayout, QTabWidget, QLabel, QLineEdit, QSpinBox,
        QDoubleSpinBox, QSlider, QCheckBox, QComboBox, QPushButton, QTableWidget,
        QTableWidgetItem, QHeaderView, QGroupBox, QFrame
    )
except ImportError:
    print("PyQt6 is required. Run 'pip install PyQt6 pynput' or execute 'run.bat'.")
    sys.exit(1)

try:
    from pynput import keyboard, mouse
except ImportError:
    keyboard = None
    mouse = None
    print("Warning: pynput not found. Global hotkeys and mouse triggers disabled; running via system tray.")


# Base Paths
APP_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(APP_DIR, "config.json")
CRASH_GUARD_PATH = os.path.join(APP_DIR, ".crash_guard")
CRASH_LOG_PATH = os.path.join(APP_DIR, "crash.log")
BACKUP_CONFIG_PATH = os.path.join(APP_DIR, "config.json.bak")

# Safe Fallback Defaults
DEFAULT_CONFIG: Dict[str, Any] = {
    "settings": {
        "app_name": "Radial Access",
        "tagline": "Native Windows Quick Launcher",
        "hotkey": "<alt>+g",
        "mouse_trigger": "middle_click",
        "settings_hotkey": "<ctrl>+<alt>+s",
        "outer_radius": 170,
        "inner_radius": 62,
        "center_deadzone": 38,
        "fps_limit": 60,
        "theme": {
            "name": "Obsidian Sky",
            "background": "#0b0f19",
            "background_alpha": 235,
            "slice_default": "#131b2e",
            "slice_hover": "#1e293b",
            "accent_color": "#0284c7",
            "accent_secondary": "#6366f1",
            "text_primary": "#f8fafc",
            "text_secondary": "#94a3b8",
            "border_color": "#334155"
        },
        "flick_gestures_enabled": True,
        "hold_to_flick_mode": True,
        "show_direction_hints": True,
        "context_switching_enabled": True,
        "flick_threshold_speed": 450.0,
        "flick_min_distance": 50,
        "hover_tooltip_delay": 0.35,
        "close_on_action": True,
        "sound_enabled": False,
        "auto_trim_memory": True,
        "safe_mode": False
    },

    "items": [
        {
            "id": "browser",
            "label": "Browser",
            "icon": "🌐",
            "color": "#0284c7",
            "type": "url",
            "payload": "https://google.com",
            "description": "Open default web browser"
        },
        {
            "id": "terminal",
            "label": "Terminal",
            "icon": "⚡",
            "color": "#10b981",
            "type": "command",
            "payload": "start wt.exe || start cmd.exe",
            "description": "Open Windows Terminal"
        },
        {
            "id": "vscode",
            "label": "VS Code",
            "icon": "📝",
            "color": "#0ea5e9",
            "type": "command",
            "payload": "code .",
            "description": "Launch Visual Studio Code"
        },
        {
            "id": "calculator",
            "label": "Calculator",
            "icon": "🔢",
            "color": "#f59e0b",
            "type": "system",
            "payload": "calc",
            "description": "Windows Calculator"
        },
        {
            "id": "explorer",
            "label": "Explorer",
            "icon": "📁",
            "color": "#eab308",
            "type": "folder",
            "payload": "explorer",
            "description": "Open File Explorer",
            "children": [
                {
                    "id": "docs",
                    "label": "Documents",
                    "icon": "📄",
                    "color": "#38bdf8",
                    "type": "folder_path",
                    "payload": "%USERPROFILE%\\Documents",
                    "description": "Documents Folder"
                },
                {
                    "id": "downloads",
                    "label": "Downloads",
                    "icon": "📥",
                    "color": "#34d399",
                    "type": "folder_path",
                    "payload": "%USERPROFILE%\\Downloads",
                    "description": "Downloads Folder"
                },
                {
                    "id": "desktop",
                    "label": "Desktop",
                    "icon": "🖥️",
                    "color": "#818cf8",
                    "type": "folder_path",
                    "payload": "%USERPROFILE%\\Desktop",
                    "description": "Desktop Folder"
                },
                {
                    "id": "drivec",
                    "label": "Drive C:",
                    "icon": "💾",
                    "color": "#fbbf24",
                    "type": "folder_path",
                    "payload": "C:\\",
                    "description": "Local Disk (C:)"
                }
            ]
        },
        {
            "id": "notes",
            "label": "Notepad",
            "icon": "📋",
            "color": "#ec4899",
            "type": "system",
            "payload": "notepad",
            "description": "Quick Notepad"
        },
        {
            "id": "snip",
            "label": "Snip Tool",
            "icon": "✂️",
            "color": "#a855f7",
            "type": "system",
            "payload": "screenshot",
            "description": "Windows Snipping Tool"
        },
        {
            "id": "tools",
            "label": "System",
            "icon": "⚙️",
            "color": "#6366f1",
            "type": "sub_menu",
            "description": "System control and tools",
            "children": [
                {
                    "id": "taskmgr",
                    "label": "Task Mgr",
                    "icon": "📊",
                    "color": "#ef4444",
                    "type": "system",
                    "payload": "taskmgr",
                    "description": "Task Manager"
                },
                {
                    "id": "settings",
                    "label": "Settings",
                    "icon": "🛠️",
                    "color": "#3b82f6",
                    "type": "command",
                    "payload": "start ms-settings:",
                    "description": "Windows Settings"
                },
                {
                    "id": "lock",
                    "label": "Lock PC",
                    "icon": "🔒",
                    "color": "#f97316",
                    "type": "system",
                    "payload": "lock",
                    "description": "Lock Workstation"
                },
                {
                    "id": "powershell",
                    "label": "PowerShell",
                    "icon": "💻",
                    "color": "#06b6d4",
                    "type": "command",
                    "payload": "start powershell.exe",
                    "description": "Open PowerShell"
                }
            ]
        }
    ],
    "context_profiles": {
        "code.exe": {
            "title": "VS Code Developer Wheel",
            "items": [
                {"id": "dev_build", "label": "Run Build", "icon": "⚡", "color": "#0ea5e9", "type": "command", "payload": "npm run build", "description": "Run project build"},
                {"id": "dev_terminal", "label": "Terminal", "icon": "💻", "color": "#10b981", "type": "command", "payload": "start wt.exe", "description": "Open Terminal"},
                {"id": "dev_git", "label": "Git Status", "icon": "🌿", "color": "#f97316", "type": "command", "payload": "git status", "description": "Git Status"},
                {"id": "dev_dev", "label": "Dev Server", "icon": "🚀", "color": "#eab308", "type": "command", "payload": "npm run dev", "description": "Start Dev Server"},
                {"id": "dev_format", "label": "Format", "icon": "✨", "color": "#8b5cf6", "type": "command", "payload": "npx prettier --write .", "description": "Format code"},
                {"id": "dev_docker", "label": "Docker", "icon": "🐳", "color": "#38bdf8", "type": "command", "payload": "docker ps", "description": "Docker Containers"},
                {"id": "dev_github", "label": "GitHub", "icon": "🔗", "color": "#a855f7", "type": "url", "payload": "https://github.com", "description": "Open GitHub"},
                {"id": "dev_notes", "label": "Scratchpad", "icon": "📝", "color": "#64748b", "type": "system", "payload": "notepad", "description": "Dev Scratchpad"}
            ]
        },
        "figma.exe": {
            "title": "Figma Designer Wheel",
            "items": [
                {"id": "des_frame", "label": "Frame", "icon": "📐", "color": "#f43f5e", "type": "command", "payload": "", "description": "Create Frame"},
                {"id": "des_color", "label": "Color Lab", "icon": "🎨", "color": "#fbbf24", "type": "system", "payload": "calc", "description": "Color Palette"},
                {"id": "des_autolayout", "label": "Auto Layout", "icon": "🗂️", "color": "#38bdf8", "type": "command", "payload": "", "description": "Auto Layout"},
                {"id": "des_export", "label": "Export", "icon": "📤", "color": "#10b981", "type": "command", "payload": "", "description": "Export assets"},
                {"id": "des_snip", "label": "Screen Snip", "icon": "✂️", "color": "#8b5cf6", "type": "system", "payload": "screenshot", "description": "Screen Snipping Tool"},
                {"id": "des_docs", "label": "Tokens", "icon": "📋", "color": "#ec4899", "type": "system", "payload": "notepad", "description": "Design Tokens"},
                {"id": "des_zoom", "label": "Zoom Fit", "icon": "🔍", "color": "#06b6d4", "type": "command", "payload": "", "description": "Zoom to Fit"},
                {"id": "des_settings", "label": "Settings", "icon": "⚙️", "color": "#94a3b8", "type": "custom", "payload": "open_settings", "description": "User Settings"}
            ]
        }
    }
}


# Known Safe Mode Minimal Items
SAFE_MODE_ITEMS: List[Dict[str, Any]] = [
    {"id": "notepad", "label": "Notepad", "icon": "📋", "color": "#38bdf8", "type": "system", "payload": "notepad", "description": "Safe Mode Notepad"},
    {"id": "calc", "label": "Calculator", "icon": "🔢", "color": "#f59e0b", "type": "system", "payload": "calc", "description": "Safe Mode Calculator"},
    {"id": "cmd", "label": "Terminal", "icon": "⚡", "color": "#10b981", "type": "command", "payload": "cmd.exe", "description": "Safe Mode Command Prompt"},
    {"id": "explorer", "label": "Explorer", "icon": "📁", "color": "#eab308", "type": "system", "payload": "explorer", "description": "Safe Mode Explorer"},
    {"id": "settings_safe", "label": "Settings", "icon": "⚙️", "color": "#818cf8", "type": "custom", "payload": "open_settings", "description": "Open User Settings Window"}
]

# Preset Color Themes
THEME_PRESETS: Dict[str, Dict[str, str]] = {
    "Obsidian Sky": {
        "background": "#0b0f19",
        "background_alpha": 235,
        "slice_default": "#131b2e",
        "slice_hover": "#1e293b",
        "accent_color": "#0284c7",
        "accent_secondary": "#6366f1",
        "text_primary": "#f8fafc",
        "text_secondary": "#94a3b8",
        "border_color": "#334155"
    },
    "Cyberpunk Neon": {
        "background": "#140c1d",
        "background_alpha": 240,
        "slice_default": "#241335",
        "slice_hover": "#3b1754",
        "accent_color": "#e11d48",
        "accent_secondary": "#facc15",
        "text_primary": "#ffffff",
        "text_secondary": "#e9d5ff",
        "border_color": "#701a75"
    },
    "Nordic Frost": {
        "background": "#0e1726",
        "background_alpha": 235,
        "slice_default": "#182438",
        "slice_hover": "#24344d",
        "accent_color": "#2dd4bf",
        "accent_secondary": "#38bdf8",
        "text_primary": "#f0fdfa",
        "text_secondary": "#99f6e4",
        "border_color": "#1e3a5f"
    },
    "Matrix Emerald": {
        "background": "#05150d",
        "background_alpha": 240,
        "slice_default": "#0b2918",
        "slice_hover": "#123f26",
        "accent_color": "#10b981",
        "accent_secondary": "#4ade80",
        "text_primary": "#ecfdf5",
        "text_secondary": "#a7f3d0",
        "border_color": "#065f46"
    },
    "Twilight Amber": {
        "background": "#1c1408",
        "background_alpha": 240,
        "slice_default": "#2c1f0c",
        "slice_hover": "#452f12",
        "accent_color": "#f59e0b",
        "accent_secondary": "#fb923c",
        "text_primary": "#fffbeb",
        "text_secondary": "#fde68a",
        "border_color": "#78350f"
    }
}


# ============================================================================
# MEMORY MANAGEMENT HELPERS
# ============================================================================

def get_process_memory_mb() -> float:
    """Returns current process working set memory in Megabytes."""
    try:
        if sys.platform == "win32":
            class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
                _fields_ = [
                    ('cb', ctypes.c_ulong),
                    ('PageFaultCount', ctypes.c_ulong),
                    ('PeakWorkingSetSize', ctypes.c_size_t),
                    ('WorkingSetSize', ctypes.c_size_t),
                    ('QuotaPeakPagedPoolUsage', ctypes.c_size_t),
                    ('QuotaPagedPoolUsage', ctypes.c_size_t),
                    ('QuotaPeakNonPagedPoolUsage', ctypes.c_size_t),
                    ('QuotaNonPagedPoolUsage', ctypes.c_size_t),
                    ('PagefileUsage', ctypes.c_size_t),
                    ('PeakPagefileUsage', ctypes.c_size_t),
                ]
            counters = PROCESS_MEMORY_COUNTERS()
            counters.cb = ctypes.sizeof(PROCESS_MEMORY_COUNTERS)
            handle = ctypes.windll.kernel32.GetCurrentProcess()
            if ctypes.windll.psapi.GetProcessMemoryInfo(handle, ctypes.byref(counters), counters.cb):
                return round(counters.WorkingSetSize / (1024 * 1024), 2)
    except Exception:
        pass
    return 0.0


def trim_process_memory():
    """Forces garbage collection and releases unreferenced physical memory to Windows OS."""
    gc.collect()
    try:
        if sys.platform == "win32":
            ctypes.windll.kernel32.SetProcessWorkingSetSize(-1, -1)
    except Exception:
        pass


def get_foreground_process_name() -> str:
    """Detects active foreground executable on Windows for context-aware wheel profiles."""
    if sys.platform != "win32":
        return "global"
    try:
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return "global"
        pid = ctypes.c_ulong()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        if not pid.value:
            return "global"

        # PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
        h_process = kernel32.OpenProcess(0x1000, False, pid.value)
        if not h_process:
            return "global"

        buf = ctypes.create_unicode_buffer(512)
        size = ctypes.c_ulong(512)
        if kernel32.QueryFullProcessImageNameW(h_process, 0, buf, ctypes.byref(size)):
            exe_path = buf.value
            kernel32.CloseHandle(h_process)
            return os.path.basename(exe_path).lower()
        kernel32.CloseHandle(h_process)
    except Exception:
        pass
    return "global"



# ============================================================================
# SAFE MODE & CRASH GUARD SUBSYSTEM
# ============================================================================

class CrashGuard:
    """Tracks clean application lifecycle to detect abnormal termination and provide recovery."""
    @staticmethod
    def set_running_flag():
        try:
            with open(CRASH_GUARD_PATH, "w", encoding="utf-8") as f:
                f.write(f"PID={os.getpid()}\nSTART_TIME={time.time()}\nDATE={time.ctime()}\n")
        except Exception as e:
            print(f"[CrashGuard] Notice: unable to write lockfile: {e}")

    @staticmethod
    def remove_running_flag():
        try:
            if os.path.exists(CRASH_GUARD_PATH):
                os.remove(CRASH_GUARD_PATH)
        except Exception:
            pass

    @staticmethod
    def check_previous_crash() -> bool:
        """Returns True if the application did not exit cleanly last time."""
        return os.path.exists(CRASH_GUARD_PATH)

    @staticmethod
    def log_crash(exc_type, exc_val, exc_tb):
        """Logs detailed unhandled exception to crash.log."""
        try:
            with open(CRASH_LOG_PATH, "a", encoding="utf-8") as f:
                f.write("\n" + "=" * 60 + "\n")
                f.write(f"RADIAL ACCESS CRASH REPORT - {time.ctime()}\n")
                f.write(f"Python: {sys.version}\nPlatform: {sys.platform}\n")
                f.write("Traceback:\n")
                traceback.print_exception(exc_type, exc_val, exc_tb, file=f)
                f.write("=" * 60 + "\n")
        except Exception:
            pass


# Global Unhandled Exception Hook
def global_exception_hook(exc_type, exc_val, exc_tb):
    CrashGuard.log_crash(exc_type, exc_val, exc_tb)
    print(f"\n[FATAL CRASH DETECTED] {exc_type.__name__}: {exc_val}")
    traceback.print_exception(exc_type, exc_val, exc_tb)

    # Show recovery prompt to user if Qt application is active
    app_inst = QApplication.instance()
    if app_inst:
        try:
            msg = QMessageBox()
            msg.setIcon(QMessageBox.Icon.Critical)
            msg.setWindowTitle("Radial Access - Crash Detected")
            msg.setText("Radial Access encountered an unexpected error.")
            msg.setInformativeText(
                f"Error: {exc_val}\n\nA crash report has been saved to '{CRASH_LOG_PATH}'.\n"
                "Would you like to restart Radial Access in Safe Mode?"
            )
            restart_btn = msg.addButton("Restart in Safe Mode", QMessageBox.ButtonRole.AcceptRole)
            exit_btn = msg.addButton("Exit", QMessageBox.ButtonRole.RejectRole)
            msg.exec()

            if msg.clickedButton() == restart_btn:
                CrashGuard.remove_running_flag()
                subprocess.Popen([sys.executable, __file__, "--safe-mode"])
        except Exception:
            pass
    sys.exit(1)

sys.excepthook = global_exception_hook
atexit.register(CrashGuard.remove_running_flag)


# ============================================================================
# CONFIGURATION MANAGEMENT
# ============================================================================

def load_config(force_safe_mode: bool = False) -> Tuple[Dict[str, Any], bool]:
    """Loads configuration, recovering seamlessly if config is corrupted."""
    is_safe = force_safe_mode
    if force_safe_mode:
        cfg = json.loads(json.dumps(DEFAULT_CONFIG))
        cfg["settings"]["safe_mode"] = True
        return cfg, True

    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                # Verify schema integrity
                if "settings" not in cfg or "items" not in cfg:
                    raise ValueError("Config missing essential root keys.")
                return cfg, bool(cfg.get("settings", {}).get("safe_mode", False))
        except Exception as e:
            print(f"[Radial Access] Error parsing config.json: {e}")
            try:
                # Backup corrupted config
                corrupt_backup = f"{CONFIG_PATH}.corrupt.{int(time.time())}"
                if os.path.exists(CONFIG_PATH):
                    os.rename(CONFIG_PATH, corrupt_backup)
                    print(f"[Radial Access] Corrupted config quarantined to: {corrupt_backup}")
            except Exception:
                pass
            is_safe = True
    else:
        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_CONFIG, f, indent=2)
        except Exception as e:
            print(f"[Radial Access] Failed to initialize default config.json: {e}")

    cfg = json.loads(json.dumps(DEFAULT_CONFIG))
    if is_safe:
        cfg["settings"]["safe_mode"] = True
    return cfg, is_safe


def save_config(config_dict: Dict[str, Any]) -> bool:
    """Safely saves configuration dictionary to config.json with backup."""
    try:
        # Create quick backup first
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f_in:
                old_data = f_in.read()
            with open(BACKUP_CONFIG_PATH, "w", encoding="utf-8") as f_bak:
                f_bak.write(old_data)

        with open(CONFIG_PATH, "w", encoding="utf-8") as f_out:
            json.dump(config_dict, f_out, indent=2)
        return True
    except Exception as e:
        print(f"[Radial Access] Failed to save config: {e}")
        return False


# ============================================================================
# ACTION EXECUTOR
# ============================================================================

class SignalBridge(QObject):
    """Bridges background thread events to the Qt main thread."""
    trigger_radial = pyqtSignal()
    open_settings = pyqtSignal()
    reload_requested = pyqtSignal()


class ActionExecutor:
    """Executes native Windows actions safely with error containment."""
    @staticmethod
    def execute(item: Dict[str, Any], bridge: Optional[SignalBridge] = None) -> None:
        item_type = item.get("type", "command")
        payload = item.get("payload", "")

        try:
            if item_type == "url":
                if payload:
                    webbrowser.open(payload)
            elif item_type in ("folder_path", "folder"):
                if payload:
                    expanded = os.path.expandvars(payload)
                    if os.path.exists(expanded):
                        os.startfile(expanded)
                    else:
                        subprocess.Popen(f'explorer "{expanded}"', shell=True)
                else:
                    subprocess.Popen('explorer.exe')
            elif item_type == "command":
                if payload:
                    subprocess.Popen(payload, shell=True)
            elif item_type == "system":
                if payload == "lock":
                    try:
                        ctypes.windll.user32.LockWorkStation()
                    except Exception:
                        pass
                elif payload == "calc":
                    subprocess.Popen("calc.exe", shell=True)
                elif payload == "notepad":
                    subprocess.Popen("notepad.exe", shell=True)
                elif payload == "taskmgr":
                    subprocess.Popen("taskmgr.exe", shell=True)
                elif payload == "screenshot":
                    subprocess.Popen("explorer.exe ms-screenclip:", shell=True)
                elif payload == "explorer":
                    subprocess.Popen("explorer.exe", shell=True)
                else:
                    subprocess.Popen(payload, shell=True)
            elif item_type == "custom":
                if payload == "open_settings" and bridge:
                    bridge.open_settings.emit()
        except Exception as e:
            print(f"[Radial Access] Failed to execute {item.get('label')}: {e}")


# ============================================================================
# RADIAL MENU WIDGET (HIGH PERFORMANCE & MEMORY OPTIMIZED)
# ============================================================================

class RadialMenuWidget(QWidget):
    """
    High-performance, anti-aliased native radial overlay window.
    Features:
    - Cached QPainterPath pie sector geometries (prevents per-frame path regeneration).
    - Sleep-mode timers (anim_timer stops when window is hidden).
    - Mouse flick gestures with bounded velocity trail buffer.
    - Safe Mode visual banner when running in fallback diagnostics mode.
    """
    def __init__(self, config: Dict[str, Any], is_safe_mode: bool, bridge: SignalBridge):
        super().__init__()
        self.config = config
        self.is_safe_mode = is_safe_mode
        self.bridge = bridge

        self.settings = config.get("settings", {})
        if self.is_safe_mode:
            self.root_items = list(SAFE_MODE_ITEMS)
        else:
            self.root_items = config.get("items", [])

        # Submenu navigation stack: list of (parent_title, items_list)
        self.menu_stack: List[Tuple[str, List[Dict[str, Any]]]] = []
        self.current_items: List[Dict[str, Any]] = list(self.root_items)
        self.current_title: str = "Safe Mode" if self.is_safe_mode else self.settings.get("app_name", "Radial Access")

        # Dimensions
        self.outer_radius = self.settings.get("outer_radius", 170)
        self.inner_radius = self.settings.get("inner_radius", 62)
        self.deadzone_radius = self.settings.get("center_deadzone", 38)
        self.dialog_size = (self.outer_radius + 40) * 2
        self.center_pt = QPointF(self.dialog_size / 2.0, self.dialog_size / 2.0)

        # Hover & Flick Gesture state (bounded to max 8 samples)
        self.hovered_index = -1
        self.hover_start_time = 0.0
        self.mouse_trail: List[Tuple[float, float, float]] = []
        self.ripple_radius = 0.0
        self.ripple_active = False

        # Memory Optimization: Cached Sector Paths dictionary
        # Key: (count, inner_radius, outer_radius, is_hovered) -> QPainterPath
        self._path_cache: Dict[Tuple[int, int, int, int, bool], QPainterPath] = {}

        # Configure Frameless Window
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setMouseTracking(True)
        self.resize(int(self.dialog_size), int(self.dialog_size))

        # Animation Timer (Only active when widget is VISIBLE)
        fps = 30 if self.is_safe_mode else self.settings.get("fps_limit", 60)
        interval_ms = max(16, int(1000 / max(15, fps)))
        self.anim_timer = QTimer(self)
        self.anim_timer.setInterval(interval_ms)
        self.anim_timer.timeout.connect(self.on_anim_tick)

        # Idle Memory Watchdog Timer (Triggers gc.collect and trims memory when hidden)
        self.idle_memory_timer = QTimer(self)
        self.idle_memory_timer.setInterval(60000)  # Every 60 seconds
        self.idle_memory_timer.timeout.connect(self.on_idle_memory_check)
        self.idle_memory_timer.start()

    def reload_config(self, new_config: Dict[str, Any], is_safe_mode: bool = False):
        """Applies refreshed configuration and clears cached geometries."""
        self.config = new_config
        self.is_safe_mode = is_safe_mode
        self.settings = new_config.get("settings", {})
        if self.is_safe_mode:
            self.root_items = list(SAFE_MODE_ITEMS)
        else:
            self.root_items = new_config.get("items", [])

        self.outer_radius = self.settings.get("outer_radius", 170)
        self.inner_radius = self.settings.get("inner_radius", 62)
        self.deadzone_radius = self.settings.get("center_deadzone", 38)
        self.dialog_size = (self.outer_radius + 40) * 2
        self.center_pt = QPointF(self.dialog_size / 2.0, self.dialog_size / 2.0)
        self.resize(int(self.dialog_size), int(self.dialog_size))

        self.menu_stack.clear()
        self.current_items = list(self.root_items)
        self.current_title = "Safe Mode" if self.is_safe_mode else self.settings.get("app_name", "Radial Access")

        # Invalidate geometry path cache
        self._path_cache.clear()

        fps = 30 if self.is_safe_mode else self.settings.get("fps_limit", 60)
        self.anim_timer.setInterval(max(16, int(1000 / max(15, fps))))
        self.update()

    def show_at_cursor(self):
        """Centers radial wheel directly on cursor coordinates and starts animation loop."""
        # Context-Aware Profile Auto-Switching based on active foreground application
        if not self.is_safe_mode and self.settings.get("context_switching_enabled", True):
            proc_name = get_foreground_process_name()
            context_profiles = self.config.get("context_profiles", {})
            matched_key = None
            for key in context_profiles:
                if key in proc_name:
                    matched_key = key
                    break
            if matched_key and "items" in context_profiles[matched_key]:
                self.current_items = list(context_profiles[matched_key]["items"])
                self.current_title = context_profiles[matched_key].get("title", matched_key)
            else:
                self.current_items = list(self.root_items)
                self.current_title = self.settings.get("app_name", "Radial Access")

        cursor_pos = QCursor.pos()
        screen = QApplication.screenAt(cursor_pos) or QApplication.primaryScreen()
        screen_geo = screen.geometry()

        tx = int(cursor_pos.x() - self.dialog_size / 2)
        ty = int(cursor_pos.y() - self.dialog_size / 2)

        # Clamp inside target screen boundaries
        tx = max(screen_geo.left(), min(tx, screen_geo.right() - int(self.dialog_size)))
        ty = max(screen_geo.top(), min(ty, screen_geo.bottom() - int(self.dialog_size)))

        self.move(tx, ty)
        self.hovered_index = -1
        self.mouse_trail.clear()
        self.show()
        self.raise_()

        self.activateWindow()

        # Start animation timer ONLY while visible (CPU & battery conservation)
        if not self.anim_timer.isActive():
            self.anim_timer.start()

    def hide_menu(self):
        """Hides menu, stops animation timers, and performs memory trim if enabled."""
        self.hide()
        # Immediately halt animation loop to save CPU
        if self.anim_timer.isActive():
            self.anim_timer.stop()

        self.menu_stack.clear()
        self.current_items = list(self.root_items)
        self.current_title = "Safe Mode" if self.is_safe_mode else self.settings.get("app_name", "Radial Access")
        self.hovered_index = -1
        self.mouse_trail.clear()

        # Quick memory trim when returning to background
        if self.settings.get("auto_trim_memory", True):
            QTimer.singleShot(1500, trim_process_memory)

    def on_idle_memory_check(self):
        """Runs periodic garbage collection when application is idle in the background."""
        if not self.isVisible() and self.settings.get("auto_trim_memory", True):
            trim_process_memory()

    def on_anim_tick(self):
        if not self.isVisible():
            self.anim_timer.stop()
            return

        # Ripple pulse animation
        if self.ripple_active and not self.is_safe_mode:
            self.ripple_radius += 7.0
            if self.ripple_radius > self.outer_radius:
                self.ripple_active = False
                self.ripple_radius = 0.0
            self.update()

        # Tooltip dwell update
        if self.hovered_index != -1:
            self.update()

    def get_sector_path(self, index: int, count: int, is_hovered: bool) -> QPainterPath:
        """Returns cached QPainterPath wedge geometry or creates and caches it."""
        cache_key = (count, int(self.inner_radius), int(self.outer_radius), index, is_hovered)
        if cache_key in self._path_cache:
            return self._path_cache[cache_key]

        slice_span = 360.0 / count
        start_angle_deg = (index * slice_span) - (slice_span / 2.0) - 90.0
        sweep_angle_deg = slice_span

        cur_outer = self.outer_radius + (8 if is_hovered else 0)
        cur_inner = self.inner_radius
        cx, cy = self.center_pt.x(), self.center_pt.y()

        outer_rect = QRectF(cx - cur_outer, cy - cur_outer, cur_outer * 2, cur_outer * 2)
        inner_rect = QRectF(cx - cur_inner, cy - cur_inner, cur_inner * 2, cur_inner * 2)

        path = QPainterPath()
        path.arcMoveTo(outer_rect, -start_angle_deg)
        path.arcTo(outer_rect, -start_angle_deg, -sweep_angle_deg)
        path.arcTo(inner_rect, -(start_angle_deg + sweep_angle_deg), sweep_angle_deg)
        path.closeSubpath()

        # Keep cache bounded to max 128 paths
        if len(self._path_cache) > 128:
            self._path_cache.clear()

        self._path_cache[cache_key] = path
        return path

    def get_slot_at_pos(self, pt: QPointF) -> int:
        """Calculates slot index from coordinates: -2 for center hub, -1 for outside."""
        dx = pt.x() - self.center_pt.x()
        dy = pt.y() - self.center_pt.y()
        dist = math.sqrt(dx * dx + dy * dy)

        if dist < self.inner_radius:
            return -2  # Inside center hub

        if dist > self.outer_radius + 20:
            return -1  # Outside wheel

        count = len(self.current_items)
        if count == 0:
            return -1

        angle_rad = math.atan2(dy, dx)
        angle_deg = math.degrees(angle_rad) + 90.0
        if angle_deg < 0:
            angle_deg += 360.0

        slice_span = 360.0 / count
        adjusted = (angle_deg + slice_span / 2.0) % 360.0
        idx = int(adjusted // slice_span)
        if 0 <= idx < count:
            return idx
        return -1

    def mouseMoveEvent(self, event):
        pos = event.position()
        now = time.time()
        self.mouse_trail.append((pos.x(), pos.y(), now))

        # Bound trail buffer to max 8 samples (prevents memory buildup)
        if len(self.mouse_trail) > 8:
            self.mouse_trail.pop(0)

        # Flick Gesture Detection Engine
        if self.settings.get("flick_gestures_enabled", True) and len(self.mouse_trail) >= 3:
            first_x, first_y, first_t = self.mouse_trail[0]
            dt = now - first_t
            if 0.03 <= dt <= 0.28:
                vx = (pos.x() - first_x) / dt
                vy = (pos.y() - first_y) / dt
                speed = math.sqrt(vx * vx + vy * vy)
                dist_from_center = math.sqrt(
                    (pos.x() - self.center_pt.x())**2 + (pos.y() - self.center_pt.y())**2
                )
                min_dist = self.settings.get("flick_min_distance", 50)
                threshold = self.settings.get("flick_threshold_speed", 450.0)

                if speed >= threshold and dist_from_center >= min_dist:
                    slot = self.get_slot_at_pos(pos)
                    if 0 <= slot < len(self.current_items):
                        self.mouse_trail.clear()
                        self.trigger_slot(slot)
                        return

        new_hover = self.get_slot_at_pos(pos)
        if new_hover != self.hovered_index:
            self.hovered_index = new_hover
            self.hover_start_time = now
            if not self.is_safe_mode:
                self.ripple_active = True
                self.ripple_radius = self.inner_radius
            self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            slot = self.get_slot_at_pos(event.position())
            if slot == -2:
                # Center Hub Click
                if self.menu_stack:
                    parent_title, parent_items = self.menu_stack.pop()
                    self.current_title = parent_title
                    self.current_items = parent_items
                    self.hovered_index = -1
                    self.update()
                else:
                    self.hide_menu()
            elif 0 <= slot < len(self.current_items):
                self.trigger_slot(slot)
            else:
                self.hide_menu()
        elif event.button() == Qt.MouseButton.RightButton:
            slot = self.get_slot_at_pos(event.position())
            if slot == -2:
                # Right clicking center hub opens Settings window instantly!
                self.hide_menu()
                self.bridge.open_settings.emit()
            elif self.menu_stack:
                parent_title, parent_items = self.menu_stack.pop()
                self.current_title = parent_title
                self.current_items = parent_items
                self.hovered_index = -1
                self.update()
            else:
                self.hide_menu()

    def mouseReleaseEvent(self, event):
        """Fires hovered slot on button release in Hold-to-Flick / Marking Menu mode."""
        if self.settings.get("hold_to_flick_mode", True) and event.button() in (Qt.MouseButton.LeftButton, Qt.MouseButton.MiddleButton):
            slot = self.get_slot_at_pos(event.position())
            if 0 <= slot < len(self.current_items):
                self.trigger_slot(slot)

    def keyPressEvent(self, event):

        if event.key() == Qt.Key.Key_Escape:
            if self.menu_stack:
                parent_title, parent_items = self.menu_stack.pop()
                self.current_title = parent_title
                self.current_items = parent_items
                self.update()
            else:
                self.hide_menu()
        elif event.key() == Qt.Key.Key_Comma and (event.modifiers() & Qt.KeyboardModifier.ControlModifier):
            # Ctrl+, opens Settings directly
            self.hide_menu()
            self.bridge.open_settings.emit()
        else:
            super().keyPressEvent(event)

    def trigger_slot(self, index: int):
        if not (0 <= index < len(self.current_items)):
            return

        item = self.current_items[index]
        children = item.get("children")

        # Nested Submenu Drill-Down
        if item.get("type") in ("sub_menu", "folder") and children and len(children) > 0:
            self.menu_stack.append((self.current_title, self.current_items))
            self.current_title = item.get("label", "Folder")
            self.current_items = list(children)
            self.hovered_index = -1
            self.mouse_trail.clear()
            self.update()
            return

        ActionExecutor.execute(item, self.bridge)

        if self.settings.get("close_on_action", True):
            self.hide_menu()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing, True)

        theme = self.settings.get("theme", {})
        cx, cy = self.center_pt.x(), self.center_pt.y()
        items = self.current_items
        count = len(items)

        if count == 0:
            painter.end()
            return

        slice_span = 360.0 / count

        # 1. Subtle Radial Halo Backdrop
        halo_brush = QRadialGradient(self.center_pt, self.outer_radius + 28)
        halo_brush.setColorAt(0.0, QColor(0, 0, 0, 160))
        halo_brush.setColorAt(0.85, QColor(0, 0, 0, 100))
        halo_brush.setColorAt(1.0, QColor(0, 0, 0, 0))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(halo_brush)
        painter.drawEllipse(self.center_pt, self.outer_radius + 28, self.outer_radius + 28)

        # 2. Draw Cached Sector Slices
        for i in range(count):
            item = items[i]
            is_hovered = (i == self.hovered_index)
            path = self.get_sector_path(i, count, is_hovered)

            item_color_hex = item.get("color", theme.get("accent_color", "#0284c7"))
            accent = QColor(item_color_hex)

            if is_hovered:
                hover_bg = QColor(theme.get("slice_hover", "#1e293b"))
                hover_bg.setAlpha(250)
                painter.setBrush(QBrush(hover_bg))
                pen = QPen(accent, 2.0)
            else:
                normal_bg = QColor(theme.get("slice_default", "#131b2e"))
                normal_bg.setAlpha(self.settings.get("theme", {}).get("background_alpha", 235))
                painter.setBrush(QBrush(normal_bg))
                pen = QPen(QColor(theme.get("border_color", "#334155")), 1.0)

            painter.setPen(pen)
            painter.drawPath(path)

            # Draw Slot Content (Icon + Label)
            angle_deg = (i * slice_span) - 90.0
            mid_rad = math.radians(angle_deg)
            r_icon = (self.inner_radius + self.outer_radius) / 2.0 - 6.0
            r_label = (self.inner_radius + self.outer_radius) / 2.0 + 12.0

            ix = cx + r_icon * math.cos(mid_rad)
            iy = cy + r_icon * math.sin(mid_rad)
            lx = cx + r_label * math.cos(mid_rad)
            ly = cy + r_label * math.sin(mid_rad)

            # Icon
            painter.setFont(QFont("Segoe UI Emoji", 14 if count <= 8 else 12))
            painter.setPen(QPen(accent))
            icon_txt = item.get("icon", "✦")
            painter.drawText(
                QRectF(ix - 18, iy - 14, 36, 28),
                Qt.AlignmentFlag.AlignCenter,
                icon_txt
            )

            # Label
            painter.setFont(QFont("Segoe UI", 8 if count > 8 else 9, QFont.Weight.Medium))
            painter.setPen(QPen(QColor(theme.get("text_primary", "#ffffff")) if is_hovered else QColor(theme.get("text_secondary", "#94a3b8"))))
            label_txt = item.get("label", "")
            if len(label_txt) > 10:
                label_txt = label_txt[:9] + "…"
            painter.drawText(
                QRectF(lx - 34, ly - 8, 68, 16),
                Qt.AlignmentFlag.AlignCenter,
                label_txt
            )

            # Direction compass hints for beginners (N, NE, E...)
            if self.settings.get("show_direction_hints", True) and count == 8:
                dir_names = ["N ↑", "NE ↗", "E →", "SE ↘", "S ↓", "SW ↙", "W ←", "NW ↖"]
                r_hint = self.inner_radius + 11.0
                hx = cx + r_hint * math.cos(mid_rad)
                hy = cy + r_hint * math.sin(mid_rad)
                painter.setFont(QFont("Segoe UI", 7, QFont.Weight.Bold))
                hint_color = QColor(accent if is_hovered else QColor(148, 163, 184, 120))
                painter.setPen(QPen(hint_color))
                painter.drawText(
                    QRectF(hx - 16, hy - 7, 32, 14),
                    Qt.AlignmentFlag.AlignCenter,
                    dir_names[i]
                )

        # 3. Ripple Ring Animation

        if self.ripple_active and not self.is_safe_mode:
            progress = (self.ripple_radius - self.inner_radius) / max(1.0, (self.outer_radius - self.inner_radius))
            alpha = max(0, int((1.0 - progress) * 140))
            ripple_pen = QPen(QColor(theme.get("accent_color", "#0284c7")), 2.0)
            ripple_color = QColor(theme.get("accent_color", "#0284c7"))
            ripple_color.setAlpha(alpha)
            ripple_pen.setColor(ripple_color)
            painter.setPen(ripple_pen)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawEllipse(self.center_pt, self.ripple_radius, self.ripple_radius)

        # 4. Center Hub
        hub_bg = QColor(theme.get("background", "#0b0f19"))
        hub_bg.setAlpha(250)
        painter.setBrush(QBrush(hub_bg))
        hub_pen = QPen(QColor(theme.get("accent_color", "#0284c7")), 1.5)
        painter.setPen(hub_pen)
        painter.drawEllipse(self.center_pt, self.inner_radius, self.inner_radius)

        if self.menu_stack:
            painter.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(theme.get("accent_color", "#0284c7"))))
            painter.drawText(QRectF(cx - 20, cy - 16, 40, 18), Qt.AlignmentFlag.AlignCenter, "←")
            painter.setFont(QFont("Segoe UI", 8, QFont.Weight.DemiBold))
            painter.drawText(QRectF(cx - 35, cy + 2, 70, 16), Qt.AlignmentFlag.AlignCenter, "BACK")
        else:
            painter.setFont(QFont("Segoe UI", 12))
            painter.setPen(QPen(QColor(theme.get("accent_color", "#0284c7"))))
            painter.drawText(QRectF(cx - 20, cy - 18, 40, 18), Qt.AlignmentFlag.AlignCenter, "✦")
            painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(theme.get("text_primary", "#ffffff"))))
            brand = "SAFE MODE" if self.is_safe_mode else self.current_title[:11]
            painter.drawText(QRectF(cx - 40, cy + 2, 80, 16), Qt.AlignmentFlag.AlignCenter, brand)

        # 5. Safe Mode Badge Banner
        if self.is_safe_mode:
            banner_rect = QRectF(cx - 65, cy - self.outer_radius - 22, 130, 20)
            painter.setBrush(QBrush(QColor(245, 158, 11, 240)))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawRoundedRect(banner_rect, 4.0, 4.0)
            painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(15, 23, 42)))
            painter.drawText(banner_rect, Qt.AlignmentFlag.AlignCenter, "⚠️ SAFE MODE ACTIVE")

        # 6. Secondary Hover Tooltip (> 350ms dwell)
        if 0 <= self.hovered_index < count:
            now = time.time()
            delay = self.settings.get("hover_tooltip_delay", 0.35)
            if (now - self.hover_start_time) >= delay:
                item = items[self.hovered_index]
                desc = item.get("description", item.get("label", ""))
                if desc:
                    fm = QFontMetrics(QFont("Segoe UI", 9))
                    txt_w = fm.horizontalAdvance(desc) + 24
                    txt_h = 28
                    tip_x = cx - (txt_w / 2.0)
                    tip_y = cy + self.outer_radius + 18

                    tip_rect = QRectF(tip_x, tip_y, txt_w, txt_h)
                    painter.setBrush(QBrush(QColor(15, 23, 42, 245)))
                    painter.setPen(QPen(QColor(theme.get("border_color", "#334155")), 1.0))
                    painter.drawRoundedRect(tip_rect, 6.0, 6.0)

                    painter.setFont(QFont("Segoe UI", 9))
                    painter.setPen(QPen(QColor(theme.get("text_primary", "#f8fafc"))))
                    painter.drawText(tip_rect, Qt.AlignmentFlag.AlignCenter, desc)

        painter.end()


# ============================================================================
# USER SETTINGS WINDOW (EASILY ACCESSIBLE DIALOG)
# ============================================================================

class SettingsDialog(QDialog):
    """
    Dedicated, modern Windows 11 style user settings window.
    Accessible via:
    1. System tray menu -> 'Settings & Preferences'
    2. Double clicking the tray icon
    3. Right-clicking or clicking center hub of the radial menu
    4. Global hotkey (Ctrl+Alt+S or Ctrl+,)
    """
    def __init__(self, config: Dict[str, Any], is_safe_mode: bool, on_save_callback):
        super().__init__()
        self.config = json.loads(json.dumps(config))  # Deep copy
        self.is_safe_mode = is_safe_mode
        self.on_save_callback = on_save_callback

        self.setWindowTitle("Radial Access - Preferences & System Settings")
        self.resize(680, 560)
        self.setMinimumSize(600, 480)

        # Modern Dark Palette
        self.setStyleSheet("""
            QDialog {
                background-color: #0b0f19;
                color: #f8fafc;
                font-family: 'Segoe UI', sans-serif;
            }
            QTabWidget::pane {
                border: 1px solid #1e293b;
                background-color: #0f172a;
                border-radius: 8px;
            }
            QTabBar::tab {
                background: #0b0f19;
                color: #94a3b8;
                padding: 10px 16px;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                margin-right: 4px;
                font-weight: 600;
                font-size: 12px;
            }
            QTabBar::tab:selected {
                background: #0f172a;
                color: #38bdf8;
                border: 1px solid #1e293b;
                border-bottom: none;
            }
            QGroupBox {
                border: 1px solid #1e293b;
                border-radius: 8px;
                margin-top: 12px;
                padding-top: 16px;
                font-weight: bold;
                color: #38bdf8;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 12px;
                padding: 0 4px;
            }
            QLabel {
                color: #cbd5e1;
                font-size: 12px;
            }
            QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox {
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 6px 10px;
                color: #ffffff;
                font-size: 12px;
            }
            QLineEdit:focus, QSpinBox:focus, QComboBox:focus {
                border: 1px solid #0284c7;
            }
            QCheckBox {
                color: #f1f5f9;
                font-size: 12px;
                spacing: 8px;
            }
            QPushButton {
                background-color: #0284c7;
                color: #ffffff;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: 600;
                font-size: 12px;
            }
            QPushButton:hover {
                background-color: #0369a1;
            }
            QPushButton.secondary {
                background-color: #1e293b;
                border: 1px solid #334155;
                color: #e2e8f0;
            }
            QPushButton.secondary:hover {
                background-color: #334155;
            }
            QPushButton.danger {
                background-color: #dc2626;
            }
            QPushButton.danger:hover {
                background-color: #b91c1c;
            }
            QTableWidget {
                background-color: #0b0f19;
                border: 1px solid #1e293b;
                border-radius: 6px;
                gridline-color: #1e293b;
                color: #f8fafc;
            }
            QHeaderView::section {
                background-color: #1e293b;
                color: #94a3b8;
                padding: 4px;
                border: none;
                font-weight: bold;
            }
        """)

        main_layout = QVBoxLayout(self)

        # Top Header Banner
        header_layout = QHBoxLayout()
        header_title = QLabel("⚙️ Radial Access Preferences")
        header_title.setStyleSheet("font-size: 16px; font-weight: bold; color: #38bdf8;")
        header_layout.addWidget(header_title)

        if self.is_safe_mode:
            safe_badge = QLabel("⚠️ SAFE MODE ACTIVE")
            safe_badge.setStyleSheet("background-color: #d97706; color: #ffffff; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 11px;")
            header_layout.addWidget(safe_badge)

        header_layout.addStretch()
        main_layout.addLayout(header_layout)

        # Tab Widget
        tabs = QTabWidget()
        tabs.addTab(self.create_general_tab(), "General")
        tabs.addTab(self.create_gestures_tab(), "Gestures & Flick")
        tabs.addTab(self.create_appearance_tab(), "Appearance & Theme")
        tabs.addTab(self.create_slots_tab(), "Slots & Items")
        tabs.addTab(self.create_performance_tab(), "Performance & Memory")
        tabs.addTab(self.create_safe_mode_tab(), "Safe Mode & Diagnostics")
        main_layout.addWidget(tabs)

        # Bottom Button Bar
        btn_bar = QHBoxLayout()
        btn_bar.addStretch()

        btn_cancel = QPushButton("Cancel")
        btn_cancel.setProperty("class", "secondary")
        btn_cancel.clicked.connect(self.reject)
        btn_bar.addWidget(btn_cancel)

        btn_save = QPushButton("Save & Apply")
        btn_save.clicked.connect(self.save_and_apply)
        btn_bar.addWidget(btn_save)

        main_layout.addLayout(btn_bar)

    def create_general_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)

        grp = QGroupBox("Core Behavior")
        form = QVBoxLayout(grp)

        # App Name
        h_name = QHBoxLayout()
        h_name.addWidget(QLabel("Application Name:"))
        self.edit_app_name = QLineEdit(self.config.get("settings", {}).get("app_name", "Radial Access"))
        h_name.addWidget(self.edit_app_name)
        form.addLayout(h_name)

        # Global Hotkey
        h_hotkey = QHBoxLayout()
        h_hotkey.addWidget(QLabel("Summon Hotkey:"))
        self.edit_hotkey = QLineEdit(self.config.get("settings", {}).get("hotkey", "<alt>+<space>"))
        self.edit_hotkey.setPlaceholderText("<alt>+<space> or <ctrl>+<space>")
        h_hotkey.addWidget(self.edit_hotkey)
        form.addLayout(h_hotkey)

        # Close on action
        self.chk_close_on_action = QCheckBox("Automatically close radial wheel when an action or slot is executed")
        self.chk_close_on_action.setChecked(self.config.get("settings", {}).get("close_on_action", True))
        form.addWidget(self.chk_close_on_action)

        # Sound effects
        self.chk_sound = QCheckBox("Enable acoustic chimes and hover tick feedback")
        self.chk_sound.setChecked(self.config.get("settings", {}).get("sound_enabled", True))
        form.addWidget(self.chk_sound)

        # Run on Windows Startup
        self.chk_startup = QCheckBox("Launch Radial Access automatically on Windows startup")
        self.chk_startup.setChecked(self.check_windows_startup())
        form.addWidget(self.chk_startup)

        layout.addWidget(grp)
        layout.addStretch()
        return widget

    def create_gestures_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)

        grp = QGroupBox("Directional Mouse-Flick Physics")
        v = QVBoxLayout(grp)

        self.chk_flick = QCheckBox("Enable mouse-flick gestures (trigger items by swiping without clicking)")
        self.chk_flick.setChecked(self.config.get("settings", {}).get("flick_gestures_enabled", True))
        v.addWidget(self.chk_flick)

        # Speed threshold
        h_speed = QHBoxLayout()
        h_speed.addWidget(QLabel("Flick Velocity Threshold (px/sec):"))
        self.spin_flick_speed = QSpinBox()
        self.spin_flick_speed.setRange(200, 1500)
        self.spin_flick_speed.setSingleStep(50)
        self.spin_flick_speed.setValue(int(self.config.get("settings", {}).get("flick_threshold_speed", 450.0)))
        h_speed.addWidget(self.spin_flick_speed)
        v.addLayout(h_speed)

        # Min Distance
        h_dist = QHBoxLayout()
        h_dist.addWidget(QLabel("Minimum Flick Distance from Center (px):"))
        self.spin_flick_dist = QSpinBox()
        self.spin_flick_dist.setRange(20, 120)
        self.spin_flick_dist.setValue(int(self.config.get("settings", {}).get("flick_min_distance", 50)))
        h_dist.addWidget(self.spin_flick_dist)
        v.addLayout(h_dist)

        # Tooltip delay
        h_dwell = QHBoxLayout()
        h_dwell.addWidget(QLabel("Secondary Tooltip Dwell Delay (seconds):"))
        self.spin_tooltip_delay = QDoubleSpinBox()
        self.spin_tooltip_delay.setRange(0.15, 1.50)
        self.spin_tooltip_delay.setSingleStep(0.05)
        self.spin_tooltip_delay.setValue(float(self.config.get("settings", {}).get("hover_tooltip_delay", 0.35)))
        h_dwell.addWidget(self.spin_tooltip_delay)
        v.addLayout(h_dwell)

        layout.addWidget(grp)
        layout.addStretch()
        return widget

    def create_appearance_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)

        grp = QGroupBox("Radial Geometry & Theme")
        v = QVBoxLayout(grp)

        # Theme selector
        h_theme = QHBoxLayout()
        h_theme.addWidget(QLabel("Preset Theme:"))
        self.combo_theme = QComboBox()
        self.combo_theme.addItems(list(THEME_PRESETS.keys()))
        current_theme_name = self.config.get("settings", {}).get("theme", {}).get("name", "Obsidian Sky")
        if current_theme_name in THEME_PRESETS:
            self.combo_theme.setCurrentText(current_theme_name)
        h_theme.addWidget(self.combo_theme)
        v.addLayout(h_theme)

        # Outer Radius
        h_outer = QHBoxLayout()
        h_outer.addWidget(QLabel("Outer Wheel Radius (px):"))
        self.spin_outer_r = QSpinBox()
        self.spin_outer_r.setRange(120, 240)
        self.spin_outer_r.setValue(int(self.config.get("settings", {}).get("outer_radius", 170)))
        h_outer.addWidget(self.spin_outer_r)
        v.addLayout(h_outer)

        # Inner Radius
        h_inner = QHBoxLayout()
        h_inner.addWidget(QLabel("Inner Hub Radius (px):"))
        self.spin_inner_r = QSpinBox()
        self.spin_inner_r.setRange(45, 95)
        self.spin_inner_r.setValue(int(self.config.get("settings", {}).get("inner_radius", 62)))
        h_inner.addWidget(self.spin_inner_r)
        v.addLayout(h_inner)

        # Deadzone
        h_dead = QHBoxLayout()
        h_dead.addWidget(QLabel("Center Deadzone Radius (px):"))
        self.spin_deadzone = QSpinBox()
        self.spin_deadzone.setRange(20, 60)
        self.spin_deadzone.setValue(int(self.config.get("settings", {}).get("center_deadzone", 38)))
        h_dead.addWidget(self.spin_deadzone)
        v.addLayout(h_dead)

        layout.addWidget(grp)
        layout.addStretch()
        return widget

    def create_slots_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)

        layout.addWidget(QLabel("Configured Radial Slots (Root Level):"))

        self.slots_table = QTableWidget()
        self.slots_table.setColumnCount(4)
        self.slots_table.setHorizontalHeaderLabels(["Icon", "Label", "Type", "Payload / Command"])
        self.slots_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.slots_table.horizontalHeader().setStretchLastSection(True)

        items = self.config.get("items", [])
        self.slots_table.setRowCount(len(items))
        for row, item in enumerate(items):
            self.slots_table.setItem(row, 0, QTableWidgetItem(str(item.get("icon", ""))))
            self.slots_table.setItem(row, 1, QTableWidgetItem(str(item.get("label", ""))))
            self.slots_table.setItem(row, 2, QTableWidgetItem(str(item.get("type", ""))))
            self.slots_table.setItem(row, 3, QTableWidgetItem(str(item.get("payload", ""))))

        layout.addWidget(self.slots_table)

        btn_row = QHBoxLayout()
        btn_open_json = QPushButton("Edit config.json in Notepad")
        btn_open_json.setProperty("class", "secondary")
        btn_open_json.clicked.connect(lambda: subprocess.Popen(f'notepad.exe "{CONFIG_PATH}"', shell=True))
        btn_row.addWidget(btn_open_json)

        btn_row.addStretch()
        layout.addLayout(btn_row)

        return widget

    def create_performance_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)

        grp_mem = QGroupBox("Active Memory Diagnostics")
        v_mem = QVBoxLayout(grp_mem)

        self.lbl_mem_usage = QLabel(f"Current Process Working Set: {get_process_memory_mb()} MB")
        self.lbl_mem_usage.setStyleSheet("font-size: 14px; font-weight: bold; color: #10b981;")
        v_mem.addWidget(self.lbl_mem_usage)

        self.chk_auto_trim = QCheckBox("Automatically trim process working set when radial menu is hidden")
        self.chk_auto_trim.setChecked(self.config.get("settings", {}).get("auto_trim_memory", True))
        v_mem.addWidget(self.chk_auto_trim)

        # Performance Refresh Buttons
        h_actions = QHBoxLayout()
        btn_collect = QPushButton("Run Garbage Collection (gc.collect)")
        btn_collect.setProperty("class", "secondary")
        btn_collect.clicked.connect(self.on_manual_gc)
        h_actions.addWidget(btn_collect)

        btn_trim = QPushButton("Trim Working Set Now")
        btn_trim.setProperty("class", "secondary")
        btn_trim.clicked.connect(self.on_manual_trim)
        h_actions.addWidget(btn_trim)
        v_mem.addLayout(h_actions)

        layout.addWidget(grp_mem)

        grp_fps = QGroupBox("Rendering Performance")
        v_fps = QVBoxLayout(grp_fps)

        h_fps = QHBoxLayout()
        h_fps.addWidget(QLabel("Target Frame Rate limit:"))
        self.combo_fps = QComboBox()
        self.combo_fps.addItems(["60 FPS (Ultra Smooth)", "30 FPS (Power Saver)", "15 FPS (Minimal)"])
        current_fps = self.config.get("settings", {}).get("fps_limit", 60)
        if current_fps == 30:
            self.combo_fps.setCurrentIndex(1)
        elif current_fps == 15:
            self.combo_fps.setCurrentIndex(2)
        else:
            self.combo_fps.setCurrentIndex(0)
        h_fps.addWidget(self.combo_fps)
        v_fps.addLayout(h_fps)

        layout.addWidget(grp_fps)
        layout.addStretch()
        return widget

    def create_safe_mode_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)

        grp_safe = QGroupBox("Crash Guard & Safe Mode")
        v_safe = QVBoxLayout(grp_safe)

        status_text = "Status: ACTIVE (Running with Fail-Safe settings)" if self.is_safe_mode else "Status: Inactive (Normal Mode)"
        status_color = "#f59e0b" if self.is_safe_mode else "#10b981"
        self.lbl_safe_status = QLabel(status_text)
        self.lbl_safe_status.setStyleSheet(f"font-size: 13px; font-weight: bold; color: {status_color};")
        v_safe.addWidget(self.lbl_safe_status)

        v_safe.addWidget(QLabel(
            "Safe Mode starts Radial Access with minimal fail-safe shortcuts, disables heavy animations,\n"
            "and ensures access even if config.json was corrupted or external programs crash."
        ))

        h_safe_btns = QHBoxLayout()
        btn_view_crash_log = QPushButton("View Crash Log (crash.log)")
        btn_view_crash_log.setProperty("class", "secondary")
        btn_view_crash_log.clicked.connect(self.open_crash_log)
        h_safe_btns.addWidget(btn_view_crash_log)

        btn_backup = QPushButton("Create Config Backup (.bak)")
        btn_backup.setProperty("class", "secondary")
        btn_backup.clicked.connect(self.create_config_backup)
        h_safe_btns.addWidget(btn_backup)
        v_safe.addLayout(h_safe_btns)

        layout.addWidget(grp_safe)

        grp_recovery = QGroupBox("Disaster Recovery Actions")
        v_rec = QVBoxLayout(grp_recovery)

        btn_restore_defaults = QPushButton("Reset Configuration to Factory Defaults")
        btn_restore_defaults.setProperty("class", "danger")
        btn_restore_defaults.clicked.connect(self.restore_factory_defaults)
        v_rec.addWidget(btn_restore_defaults)

        layout.addWidget(grp_recovery)
        layout.addStretch()
        return widget

    def on_manual_gc(self):
        collected = gc.collect()
        self.lbl_mem_usage.setText(f"Current Process Working Set: {get_process_memory_mb()} MB (GC collected {collected} objects)")

    def on_manual_trim(self):
        trim_process_memory()
        self.lbl_mem_usage.setText(f"Current Process Working Set: {get_process_memory_mb()} MB (Memory Trimmed)")

    def open_crash_log(self):
        if os.path.exists(CRASH_LOG_PATH):
            subprocess.Popen(f'notepad.exe "{CRASH_LOG_PATH}"', shell=True)
        else:
            QMessageBox.information(self, "Crash Log", "No crashes detected! 'crash.log' does not exist.")

    def create_config_backup(self):
        try:
            with open(BACKUP_CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=2)
            QMessageBox.information(self, "Backup Created", f"Backup successfully saved to:\n{BACKUP_CONFIG_PATH}")
        except Exception as e:
            QMessageBox.warning(self, "Backup Failed", f"Failed to save backup: {e}")

    def restore_factory_defaults(self):
        reply = QMessageBox.question(
            self,
            "Reset Defaults",
            "Are you sure you want to restore factory default configuration? Any custom slots will be reset.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            self.config = json.loads(json.dumps(DEFAULT_CONFIG))
            save_config(self.config)
            QMessageBox.information(self, "Defaults Restored", "Configuration restored. Please restart or click Save & Apply.")

    def check_windows_startup(self) -> bool:
        """Checks if startup registry entry exists on Windows."""
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_READ)
            val, _ = winreg.QueryValueEx(key, "RadialAccess")
            winreg.CloseKey(key)
            return bool(val)
        except Exception:
            return False

    def set_windows_startup(self, enable: bool):
        """Adds or removes executable from Windows Run registry."""
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE)
            if enable:
                cmd = f'"{sys.executable}" "{os.path.abspath(__file__)}"'
                winreg.SetValueEx(key, "RadialAccess", 0, winreg.REG_SZ, cmd)
            else:
                try:
                    winreg.DeleteValue(key, "RadialAccess")
                except FileNotFoundError:
                    pass
            winreg.CloseKey(key)
        except Exception as e:
            print(f"[Radial Access Startup Config] Note: {e}")

    def save_and_apply(self):
        """Saves values into self.config and notifies main controller."""
        s = self.config.setdefault("settings", {})
        s["app_name"] = self.edit_app_name.text().strip() or "Radial Access"
        s["hotkey"] = self.edit_hotkey.text().strip() or "<alt>+<space>"
        s["close_on_action"] = self.chk_close_on_action.isChecked()
        s["sound_enabled"] = self.chk_sound.isChecked()

        s["flick_gestures_enabled"] = self.chk_flick.isChecked()
        s["flick_threshold_speed"] = float(self.spin_flick_speed.value())
        s["flick_min_distance"] = self.spin_flick_dist.value()
        s["hover_tooltip_delay"] = float(self.spin_tooltip_delay.value())

        s["outer_radius"] = self.spin_outer_r.value()
        s["inner_radius"] = self.spin_inner_r.value()
        s["center_deadzone"] = self.spin_deadzone.value()

        selected_theme = self.combo_theme.currentText()
        if selected_theme in THEME_PRESETS:
            theme_dict = dict(THEME_PRESETS[selected_theme])
            theme_dict["name"] = selected_theme
            s["theme"] = theme_dict

        s["auto_trim_memory"] = self.chk_auto_trim.isChecked()

        fps_choice = self.combo_fps.currentIndex()
        s["fps_limit"] = 60 if fps_choice == 0 else (30 if fps_choice == 1 else 15)

        # Save registry startup preference
        self.set_windows_startup(self.chk_startup.isChecked())

        save_config(self.config)
        self.on_save_callback(self.config)
        self.accept()


# ============================================================================
# HOTKEY LISTENER THREAD (PYNPUT WITH CLEAN SHUTDOWN)
# ============================================================================

class HotkeyListenerThread:
    """Listens for global summon hotkey, middle mouse clicks, and settings hotkey."""
    def __init__(self, hotkey_str: str, settings_hotkey_str: str, mouse_trigger: str, bridge: SignalBridge):
        self.hotkey_str = hotkey_str
        self.settings_hotkey_str = settings_hotkey_str
        self.mouse_trigger = mouse_trigger
        self.bridge = bridge
        self.hotkey_listener = None
        self.mouse_listener = None
        self.thread = None

    def start(self):
        def on_radial_trigger():
            self.bridge.trigger_radial.emit()

        def on_settings_trigger():
            self.bridge.open_settings.emit()

        # Keyboard listener
        if keyboard:
            try:
                combo_radial = self.hotkey_str.lower().strip() or "<alt>+g"
                combo_settings = self.settings_hotkey_str.lower().strip() or "<ctrl>+<alt>+s"

                mapping = {
                    combo_radial: on_radial_trigger,
                    combo_settings: on_settings_trigger
                }

                self.hotkey_listener = keyboard.GlobalHotKeys(mapping)
                self.thread = threading.Thread(target=self.hotkey_listener.run, daemon=True)
                self.thread.start()
                print(f"[Radial Access] Global hotkeys active: Summon={combo_radial}, Settings={combo_settings}")
            except Exception as e:
                print(f"[Radial Access] Keyboard listener notice: {e}")

        # Mouse listener (middle click trigger)
        if mouse and self.mouse_trigger in ("middle_click", "both", True):
            try:
                def on_mouse_click(x, y, button, pressed):
                    if button == mouse.Button.middle and pressed:
                        on_radial_trigger()

                self.mouse_listener = mouse.Listener(on_click=on_mouse_click)
                self.mouse_listener.daemon = True
                self.mouse_listener.start()
                print("[Radial Access] Global Mouse Trigger active: Middle Mouse Button")
            except Exception as e:
                print(f"[Radial Access] Mouse listener notice: {e}")

    def stop(self):
        if self.hotkey_listener:
            try:
                self.hotkey_listener.stop()
            except Exception:
                pass
        if self.mouse_listener:
            try:
                self.mouse_listener.stop()
            except Exception:
                pass



# ============================================================================
# APPLICATION MAIN ENTRY POINT
# ============================================================================

def main():
    # Parse CLI flags
    force_safe_mode = "--safe-mode" in sys.argv or "-s" in sys.argv
    reset_config_flag = "--reset-config" in sys.argv

    if reset_config_flag:
        print("[Radial Access] Resetting config.json to factory defaults...")
        save_config(DEFAULT_CONFIG)

    # Detect previous crash
    has_crashed_previously = CrashGuard.check_previous_crash()
    is_safe = force_safe_mode or has_crashed_previously

    app = QApplication(sys.argv)
    app.setApplicationName("Radial Access")
    app.setQuitOnLastWindowClosed(False)

    # Write startup lockfile
    CrashGuard.set_running_flag()

    # Load configuration
    config, is_safe = load_config(force_safe_mode=is_safe)
    bridge = SignalBridge()

    # Create Radial Menu Window
    radial_window = RadialMenuWidget(config, is_safe_mode=is_safe, bridge=bridge)
    bridge.trigger_radial.connect(radial_window.show_at_cursor)

    # Settings Dialog Controller
    settings_dialog_ref: List[Optional[SettingsDialog]] = [None]

    def open_settings_window():
        if settings_dialog_ref[0] is not None and settings_dialog_ref[0].isVisible():
            settings_dialog_ref[0].raise_()
            settings_dialog_ref[0].activateWindow()
            return

        def on_settings_saved(new_cfg: Dict[str, Any]):
            radial_window.reload_config(new_cfg, is_safe_mode=False)
            print("[Radial Access] Configuration updated via Settings dialog.")

        dlg = SettingsDialog(config, is_safe_mode=is_safe, on_save_callback=on_settings_saved)
        settings_dialog_ref[0] = dlg
        dlg.exec()
        settings_dialog_ref[0] = None

    bridge.open_settings.connect(open_settings_window)

    # Hotkey Thread Worker
    settings_sec = config.get("settings", {})
    hotkey_str = settings_sec.get("hotkey", "<alt>+g")
    settings_hotkey_str = settings_sec.get("settings_hotkey", "<ctrl>+<alt>+s")
    mouse_trigger_str = settings_sec.get("mouse_trigger", "middle_click")

    hotkey_worker = HotkeyListenerThread(hotkey_str, settings_hotkey_str, mouse_trigger_str, bridge)
    hotkey_worker.start()


    # Tray Icon Initialization
    tray_icon = QSystemTrayIcon()

    # Draw sharp Tray Compass Icon
    pixmap = QPixmap(32, 32)
    pixmap.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
    painter.setBrush(QBrush(QColor("#0284c7") if not is_safe else QColor("#f59e0b")))
    painter.setPen(QPen(QColor("#ffffff"), 1.5))
    painter.drawEllipse(2, 2, 28, 28)
    painter.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
    painter.drawText(QRectF(0, 0, 32, 32), Qt.AlignmentFlag.AlignCenter, "✦")
    painter.end()

    tray_icon.setIcon(QIcon(pixmap))
    tray_tooltip = f"Radial Access ({hotkey_str})" if not is_safe else f"Radial Access [SAFE MODE] ({hotkey_str})"
    tray_icon.setToolTip(tray_tooltip)

    # System Tray Context Menu
    tray_menu = QMenu()

    action_summon = tray_menu.addAction(f"Summon Radial Wheel ({hotkey_str})")
    action_summon.triggered.connect(radial_window.show_at_cursor)

    action_settings = tray_menu.addAction("⚙️ Settings & Preferences (Ctrl+,)")
    action_settings.triggered.connect(open_settings_window)

    tray_menu.addSeparator()

    if is_safe:
        def on_exit_safe_mode():
            CrashGuard.remove_running_flag()
            cfg_clean, _ = load_config(force_safe_mode=False)
            cfg_clean["settings"]["safe_mode"] = False
            save_config(cfg_clean)
            radial_window.reload_config(cfg_clean, is_safe_mode=False)
            tray_icon.setToolTip(f"Radial Access ({hotkey_str})")
            QMessageBox.information(None, "Safe Mode", "Restored normal configuration mode.")

        action_exit_safe = tray_menu.addAction("🛡️ Exit Safe Mode (Restore Normal)")
        action_exit_safe.triggered.connect(on_exit_safe_mode)

    action_reload = tray_menu.addAction("Reload config.json")
    def on_reload_config():
        fresh_cfg, safe_flag = load_config(force_safe_mode=False)
        radial_window.reload_config(fresh_cfg, is_safe_mode=safe_flag)
        print("[Radial Access] Reloaded configuration from disk.")
    action_reload.triggered.connect(on_reload_config)

    action_edit = tray_menu.addAction("Edit config.json in Notepad")
    action_edit.triggered.connect(lambda: subprocess.Popen(f'notepad.exe "{CONFIG_PATH}"', shell=True))

    action_dir = tray_menu.addAction("Open App Folder")
    action_dir.triggered.connect(lambda: os.startfile(APP_DIR))

    tray_menu.addSeparator()

    action_quit = tray_menu.addAction("Exit Radial Access")
    def on_graceful_exit():
        CrashGuard.remove_running_flag()
        hotkey_worker.stop()
        app.quit()
    action_quit.triggered.connect(on_graceful_exit)

    tray_icon.setContextMenu(tray_menu)

    # Double click on tray icon opens Settings! Single click summons wheel!
    def on_tray_activated(reason):
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            open_settings_window()
        elif reason == QSystemTrayIcon.ActivationReason.Trigger:
            radial_window.show_at_cursor()

    tray_icon.activated.connect(on_tray_activated)
    tray_icon.show()

    # Clean exit cleanup
    app.aboutToQuit.connect(CrashGuard.remove_running_flag)
    app.aboutToQuit.connect(hotkey_worker.stop)

    print("==========================================================")
    print("  Radial Access - Native Windows Desktop Overlay Running! ")
    if is_safe:
        print("  ⚠️ RUNNING IN SAFE MODE (Fail-Safe Recovery Active)   ")
    print(f"  Summon Shortcut   : {hotkey_str}                       ")
    print(f"  Settings Shortcut : {settings_hotkey_str} or Tray Double-Click")
    print("==========================================================")

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
