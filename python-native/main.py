#!/usr/bin/env python3
"""
Radial Access - Native Windows Radial Menu & Quick Launcher
Built with PyQt6 & pynput for native Windows desktop environments.
"""

import sys
import os
import json
import math
import time
import ctypes
import webbrowser
import subprocess
import threading
from typing import List, Dict, Any, Optional

try:
    from PyQt6.QtCore import Qt, QPoint, QPointF, QRectF, QTimer, pyqtSignal, QObject
    from PyQt6.QtGui import (
        QPainter, QPainterPath, QColor, QPen, QBrush, QFont,
        QCursor, QIcon, QPixmap, QLinearGradient, QRadialGradient, QFontMetrics
    )
    from PyQt6.QtWidgets import (
        QApplication, QWidget, QSystemTrayIcon, QMenu, QMessageBox
    )
except ImportError:
    print("PyQt6 is required. Run 'pip install PyQt6 pynput' or execute 'run.bat'.")
    sys.exit(1)

try:
    from pynput import keyboard
except ImportError:
    keyboard = None
    print("Warning: pynput not found. Global hotkeys disabled; running via system tray.")

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

DEFAULT_CONFIG: Dict[str, Any] = {
    "settings": {
        "app_name": "Radial Access",
        "tagline": "Native Windows Quick Launcher",
        "hotkey": "<alt>+<space>",
        "outer_radius": 170,
        "inner_radius": 62,
        "center_deadzone": 38,
        "theme": {
            "background": "#0b0f19",
            "background_alpha": 240,
            "slice_default": "#131b2e",
            "slice_hover": "#1e293b",
            "accent_color": "#0284c7",
            "accent_secondary": "#6366f1",
            "text_primary": "#f8fafc",
            "text_secondary": "#94a3b8",
            "border_color": "#334155"
        },
        "flick_gestures_enabled": True,
        "flick_threshold_speed": 450.0,
        "flick_min_distance": 50,
        "close_on_action": True,
        "sound_enabled": True
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
            "description": "Launch VS Code"
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
            "description": "Snipping Tool"
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
    ]
}


class SignalBridge(QObject):
    """Bridges background thread events to the Qt main GUI loop."""
    trigger_radial = pyqtSignal()
    reload_requested = pyqtSignal()


class ActionExecutor:
    """Executes native Windows actions safely."""
    @staticmethod
    def execute(item: Dict[str, Any]) -> None:
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
        except Exception as e:
            print(f"[Radial Access Error] Failed to execute {item.get('label')}: {e}")


class RadialMenuWidget(QWidget):
    """
    High-performance, anti-aliased native radial overlay window.
    Draws custom pie sectors, handles hover animation, flick gestures, and nested submenus.
    """
    def __init__(self, config: Dict[str, Any]):
        super().__init__()
        self.config = config
        self.settings = config.get("settings", {})
        self.root_items = config.get("items", [])

        # Submenu navigation stack: list of (parent_title, items_list)
        self.menu_stack: List[tuple] = []
        self.current_items: List[Dict[str, Any]] = list(self.root_items)
        self.current_title: str = self.settings.get("app_name", "Radial Access")

        # Dimensions
        self.outer_radius = self.settings.get("outer_radius", 170)
        self.inner_radius = self.settings.get("inner_radius", 62)
        self.deadzone_radius = self.settings.get("center_deadzone", 38)
        self.dialog_size = (self.outer_radius + 40) * 2
        self.center_pt = QPointF(self.dialog_size / 2.0, self.dialog_size / 2.0)

        # Hover and Flick Gesture state
        self.hovered_index = -1
        self.hover_start_time = 0.0
        self.mouse_trail: List[tuple] = []  # (x, y, timestamp)
        self.ripple_radius = 0.0
        self.ripple_active = False

        # Configure Frameless Transparent Window
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setMouseTracking(True)
        self.resize(int(self.dialog_size), int(self.dialog_size))

        # Animation & Hover Tooltip Timer (60 fps)
        self.anim_timer = QTimer(self)
        self.anim_timer.timeout.connect(self.on_anim_tick)
        self.anim_timer.start(16)

    def reload_config(self, new_config: Dict[str, Any]):
        self.config = new_config
        self.settings = new_config.get("settings", {})
        self.root_items = new_config.get("items", [])
        self.outer_radius = self.settings.get("outer_radius", 170)
        self.inner_radius = self.settings.get("inner_radius", 62)
        self.deadzone_radius = self.settings.get("center_deadzone", 38)
        self.dialog_size = (self.outer_radius + 40) * 2
        self.center_pt = QPointF(self.dialog_size / 2.0, self.dialog_size / 2.0)
        self.resize(int(self.dialog_size), int(self.dialog_size))
        self.menu_stack.clear()
        self.current_items = list(self.root_items)
        self.current_title = self.settings.get("app_name", "Radial Access")
        self.update()

    def show_at_cursor(self):
        """Center the radial widget directly over the mouse cursor."""
        cursor_pos = QCursor.pos()
        screen = QApplication.screenAt(cursor_pos) or QApplication.primaryScreen()
        screen_geo = screen.geometry()

        # Target top-left
        tx = int(cursor_pos.x() - self.dialog_size / 2)
        ty = int(cursor_pos.y() - self.dialog_size / 2)

        # Clamp inside screen boundaries
        tx = max(screen_geo.left(), min(tx, screen_geo.right() - int(self.dialog_size)))
        ty = max(screen_geo.top(), min(ty, screen_geo.bottom() - int(self.dialog_size)))

        self.move(tx, ty)
        self.hovered_index = -1
        self.mouse_trail.clear()
        self.show()
        self.raise_()
        self.activateWindow()

    def hide_menu(self):
        self.hide()
        self.menu_stack.clear()
        self.current_items = list(self.root_items)
        self.current_title = self.settings.get("app_name", "Radial Access")
        self.hovered_index = -1

    def on_anim_tick(self):
        if not self.isVisible():
            return

        # Advance ripple animation if active
        if self.ripple_active:
            self.ripple_radius += 7.0
            if self.ripple_radius > self.outer_radius:
                self.ripple_active = False
                self.ripple_radius = 0.0
            self.update()

        # Update hover tooltip if hovering for > 400ms
        if self.hovered_index != -1:
            self.update()

    def get_slot_at_pos(self, pt: QPointF) -> int:
        """Determines which pie slice index (0..n-1) or -2 (center hub) the point lies within."""
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

        # Angle in degrees [0, 360), with 0 pointing straight up (-90 deg from standard +X)
        angle_rad = math.atan2(dy, dx)
        angle_deg = math.degrees(angle_rad) + 90.0
        if angle_deg < 0:
            angle_deg += 360.0

        slice_span = 360.0 / count
        # Offset by half a slice so the first slice is centered at 12 o'clock
        adjusted = (angle_deg + slice_span / 2.0) % 360.0
        idx = int(adjusted // slice_span)
        if 0 <= idx < count:
            return idx
        return -1

    def mouseMoveEvent(self, event):
        pos = event.position()
        now = time.time()
        self.mouse_trail.append((pos.x(), pos.y(), now))

        # Keep recent trail for flick velocity detection
        if len(self.mouse_trail) > 12:
            self.mouse_trail.pop(0)

        # Check Flick Gesture
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
            self.ripple_active = True
            self.ripple_radius = self.inner_radius
            self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            slot = self.get_slot_at_pos(event.position())
            if slot == -2:
                # Clicked center hub
                if self.menu_stack:
                    # Navigate back up
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
            if self.menu_stack:
                parent_title, parent_items = self.menu_stack.pop()
                self.current_title = parent_title
                self.current_items = parent_items
                self.hovered_index = -1
                self.update()
            else:
                self.hide_menu()

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Escape:
            if self.menu_stack:
                parent_title, parent_items = self.menu_stack.pop()
                self.current_title = parent_title
                self.current_items = parent_items
                self.update()
            else:
                self.hide_menu()
        else:
            super().keyPressEvent(event)

    def trigger_slot(self, index: int):
        if not (0 <= index < len(self.current_items)):
            return

        item = self.current_items[index]
        children = item.get("children")

        # If it's a submenu or folder with children, drill down
        if (item.get("type") in ("sub_menu", "folder") and children and len(children) > 0):
            self.menu_stack.append((self.current_title, self.current_items))
            self.current_title = item.get("label", "Folder")
            self.current_items = list(children)
            self.hovered_index = -1
            self.mouse_trail.clear()
            self.update()
            return

        # Otherwise execute the Windows native action
        ActionExecutor.execute(item)

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
            return

        slice_span = 360.0 / count

        # 1. Outer subtle dark halo / backdrop
        halo_brush = QRadialGradient(self.center_pt, self.outer_radius + 30)
        halo_brush.setColorAt(0.0, QColor(0, 0, 0, 160))
        halo_brush.setColorAt(0.85, QColor(0, 0, 0, 110))
        halo_brush.setColorAt(1.0, QColor(0, 0, 0, 0))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(halo_brush)
        painter.drawEllipse(self.center_pt, self.outer_radius + 30, self.outer_radius + 30)

        # 2. Draw each Pie Slice Sector
        for i in range(count):
            item = items[i]
            is_hovered = (i == self.hovered_index)

            # Slices start offset by -half_slice - 90 deg so slice 0 centers at 12 o'clock
            start_angle_deg = (i * slice_span) - (slice_span / 2.0) - 90.0
            sweep_angle_deg = slice_span

            # Radius expands slightly on hover for tactile feel
            cur_outer = self.outer_radius + (8 if is_hovered else 0)
            cur_inner = self.inner_radius

            # Construct Donut Wedge Path
            path = QPainterPath()
            outer_rect = QRectF(cx - cur_outer, cy - cur_outer, cur_outer * 2, cur_outer * 2)
            inner_rect = QRectF(cx - cur_inner, cy - cur_inner, cur_inner * 2, cur_inner * 2)

            # Qt arcTo expects angles in degrees counter-clockwise from 3 o'clock
            qt_start = - (start_angle_deg)
            qt_sweep = - (sweep_angle_deg)

            path.arcMoveTo(outer_rect, qt_start)
            path.arcTo(outer_rect, qt_start, qt_sweep)
            path.arcTo(inner_rect, qt_start + qt_sweep, -qt_sweep)
            path.closeSubpath()

            # Fill color
            base_color = QColor(item.get("color", theme.get("accent_color", "#0284c7")))
            if is_hovered:
                # Glowing slice fill
                grad = QLinearGradient(cx, cy - cur_outer, cx, cy + cur_outer)
                slice_color = QColor(theme.get("slice_hover", "#1e293b"))
                slice_color.setAlpha(245)
                grad.setColorAt(0.0, slice_color)
                grad.setColorAt(1.0, slice_color.lighter(115))
                painter.setBrush(QBrush(grad))

                # Highlight Border
                pen = QPen(base_color, 2.5)
                painter.setPen(pen)
            else:
                bg_col = QColor(theme.get("slice_default", "#131b2e"))
                bg_col.setAlpha(theme.get("background_alpha", 240))
                painter.setBrush(QBrush(bg_col))
                border_col = QColor(theme.get("border_color", "#334155"))
                painter.setPen(QPen(border_col, 1.2))

            painter.drawPath(path)

            # Ripple visual feedback on slice if hovered
            if is_hovered and self.ripple_active and self.ripple_radius > self.inner_radius:
                painter.save()
                painter.setClipPath(path)
                rip_col = QColor(base_color)
                rip_col.setAlpha(max(0, int(70 * (1.0 - (self.ripple_radius / self.outer_radius)))))
                painter.setBrush(Qt.BrushStyle.NoBrush)
                painter.setPen(QPen(rip_col, 3.5))
                painter.drawEllipse(self.center_pt, self.ripple_radius, self.ripple_radius)
                painter.restore()

            # 3. Draw Slot Content (Icon / Symbol & Label)
            mid_angle_deg = start_angle_deg + (sweep_angle_deg / 2.0)
            mid_rad = math.radians(mid_angle_deg)

            # Center of the sector mass
            content_dist = (cur_inner + cur_outer) / 2.0
            slot_cx = cx + math.cos(mid_rad) * content_dist
            slot_cy = cy + math.sin(mid_rad) * content_dist

            # Draw icon/emoji
            icon_str = item.get("icon", "•")
            painter.setFont(QFont("Segoe UI Emoji", 14 if is_hovered else 13, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(theme.get("text_primary", "#ffffff"))))
            painter.drawText(
                QRectF(slot_cx - 22, slot_cy - 20, 44, 22),
                Qt.AlignmentFlag.AlignCenter,
                icon_str
            )

            # Draw label
            label_str = item.get("label", "")
            painter.setFont(QFont("Segoe UI", 9 if is_hovered else 8, QFont.Weight.DemiBold if is_hovered else QFont.Weight.Normal))
            label_col = QColor(theme.get("text_primary", "#ffffff")) if is_hovered else QColor(theme.get("text_secondary", "#94a3b8"))
            painter.setPen(QPen(label_col))
            painter.drawText(
                QRectF(slot_cx - 40, slot_cy + 2, 80, 18),
                Qt.AlignmentFlag.AlignCenter,
                label_str
            )

            # Submenu indicator dot or arrow
            if item.get("children") or item.get("type") in ("sub_menu", "folder"):
                indicator_dist = cur_outer - 10
                ix = cx + math.cos(mid_rad) * indicator_dist
                iy = cy + math.sin(mid_rad) * indicator_dist
                painter.setBrush(QBrush(base_color))
                painter.setPen(Qt.PenStyle.NoPen)
                painter.drawEllipse(QPointF(ix, iy), 2.5, 2.5)

        # 4. Center Hub
        is_center_hover = (self.hovered_index == -2)
        center_rad = self.inner_radius - 4
        center_grad = QRadialGradient(self.center_pt, center_rad)
        if is_center_hover:
            center_grad.setColorAt(0.0, QColor(theme.get("accent_color", "#0284c7")).lighter(130))
            center_grad.setColorAt(1.0, QColor(theme.get("slice_hover", "#1e293b")))
        else:
            center_grad.setColorAt(0.0, QColor(theme.get("background", "#0b0f19")))
            center_grad.setColorAt(1.0, QColor(theme.get("slice_default", "#131b2e")))

        painter.setBrush(QBrush(center_grad))
        center_border = QColor(theme.get("accent_color", "#0284c7")) if is_center_hover else QColor(theme.get("border_color", "#334155"))
        painter.setPen(QPen(center_border, 2.0 if is_center_hover else 1.5))
        painter.drawEllipse(self.center_pt, center_rad, center_rad)

        # Center Hub Text / Branding or Back indicator
        if self.menu_stack:
            # Back Button
            painter.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(theme.get("text_primary", "#ffffff"))))
            painter.drawText(
                QRectF(cx - 30, cy - 20, 60, 20),
                Qt.AlignmentFlag.AlignCenter,
                "←"
            )
            painter.setFont(QFont("Segoe UI", 8, QFont.Weight.DemiBold))
            painter.drawText(
                QRectF(cx - 40, cy + 2, 80, 16),
                Qt.AlignmentFlag.AlignCenter,
                "BACK"
            )
        else:
            # Main Branding
            painter.setFont(QFont("Segoe UI", 12))
            painter.setPen(QPen(QColor(theme.get("accent_color", "#0284c7"))))
            painter.drawText(
                QRectF(cx - 25, cy - 18, 50, 18),
                Qt.AlignmentFlag.AlignCenter,
                "✦"
            )
            painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
            painter.setPen(QPen(QColor(theme.get("text_primary", "#ffffff"))))
            brand_name = self.current_title[:12]
            painter.drawText(
                QRectF(cx - 45, cy + 2, 90, 16),
                Qt.AlignmentFlag.AlignCenter,
                brand_name
            )

        # 5. Floating Description Tooltip (if hovering an item > 350ms)
        if 0 <= self.hovered_index < count:
            now = time.time()
            if (now - self.hover_start_time) >= 0.35:
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


class HotkeyListenerThread:
    """Listens for global hotkey presses and communicates back via Qt Signals."""
    def __init__(self, hotkey_str: str, bridge: SignalBridge):
        self.hotkey_str = hotkey_str
        self.bridge = bridge
        self.hotkey_listener = None
        self.thread = None

    def start(self):
        if not keyboard:
            return

        def on_triggered():
            self.bridge.trigger_radial.emit()

        try:
            # Map common representation to pynput format
            combo = self.hotkey_str.lower().strip()
            # Default fallback if empty
            if not combo:
                combo = "<alt>+<space>"

            self.hotkey_listener = keyboard.GlobalHotKeys({
                combo: on_triggered
            })
            self.thread = threading.Thread(target=self.hotkey_listener.run, daemon=True)
            self.thread.start()
            print(f"[Radial Access] Global hotkey registered: {combo}")
        except Exception as e:
            print(f"[Radial Access] Hotkey registration error: {e}. Defaulting to tray access.")

    def stop(self):
        if self.hotkey_listener:
            try:
                self.hotkey_listener.stop()
            except Exception:
                pass


def load_config() -> Dict[str, Any]:
    """Loads configuration from config.json or initializes it if missing."""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {CONFIG_PATH}: {e}. Using defaults.")
    else:
        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_CONFIG, f, indent=2)
        except Exception as e:
            print(f"Failed to create default config: {e}")
    return DEFAULT_CONFIG


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Radial Access")
    app.setQuitOnLastWindowClosed(False)

    config = load_config()
    bridge = SignalBridge()

    # Create Radial Menu Window
    radial_window = RadialMenuWidget(config)
    bridge.trigger_radial.connect(radial_window.show_at_cursor)

    # Reload Config Handler
    def on_reload():
        fresh_cfg = load_config()
        radial_window.reload_config(fresh_cfg)
        print("[Radial Access] Configuration reloaded.")

    bridge.reload_requested.connect(on_reload)

    # Initialize System Tray Icon
    tray_icon = QSystemTrayIcon()
    
    # Generate simple clean compass icon for the tray
    pixmap = QPixmap(32, 32)
    pixmap.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
    painter.setBrush(QBrush(QColor("#0284c7")))
    painter.setPen(QPen(QColor("#ffffff"), 1.5))
    painter.drawEllipse(2, 2, 28, 28)
    painter.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
    painter.drawText(QRectF(0, 0, 32, 32), Qt.AlignmentFlag.AlignCenter, "✦")
    painter.end()

    tray_icon.setIcon(QIcon(pixmap))
    tray_icon.setToolTip("Radial Access - Windows Quick Launcher (Alt+Space)")

    # Tray Menu
    tray_menu = QMenu()
    show_action = tray_menu.addAction("Summon Radial Menu (Alt+Space)")
    show_action.triggered.connect(radial_window.show_at_cursor)

    tray_menu.addSeparator()

    reload_action = tray_menu.addAction("Reload config.json")
    reload_action.triggered.connect(on_reload)

    edit_action = tray_menu.addAction("Edit config.json")
    def on_edit_config():
        if os.path.exists(CONFIG_PATH):
            os.startfile(CONFIG_PATH)
        else:
            subprocess.Popen(f'notepad.exe "{CONFIG_PATH}"', shell=True)
    edit_action.triggered.connect(on_edit_config)

    open_dir_action = tray_menu.addAction("Open App Folder")
    open_dir_action.triggered.connect(lambda: os.startfile(os.path.dirname(CONFIG_PATH)))

    tray_menu.addSeparator()

    quit_action = tray_menu.addAction("Exit Radial Access")
    quit_action.triggered.connect(app.quit)

    tray_icon.setContextMenu(tray_menu)
    tray_icon.activated.connect(
        lambda reason: radial_window.show_at_cursor() if reason == QSystemTrayIcon.ActivationReason.Trigger else None
    )
    tray_icon.show()

    # Start Global Hotkey Listener
    hotkey_str = config.get("settings", {}).get("hotkey", "<alt>+<space>")
    hotkey_worker = HotkeyListenerThread(hotkey_str, bridge)
    hotkey_worker.start()

    print("=====================================================")
    print("  Radial Access - Native Windows Overlay Running!    ")
    print(f"  Press {hotkey_str} anywhere to summon the radial menu. ")
    print("  Or click the tray icon in your Windows Taskbar.    ")
    print("=====================================================")

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
