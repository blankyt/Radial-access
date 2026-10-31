export type RadialItemType =
  | 'sub_menu'
  | 'folder'
  | 'tool'
  | 'file'
  | 'text_action'
  | 'system'
  | 'custom_command'
  | 'add_slot';

export type RadialTheme = 'obsidian' | 'cyberpunk' | 'nord' | 'emerald' | 'amber' | 'high_contrast';

export type ActivationTrigger = 'middle_click' | 'right_click' | 'space_drag' | 'hotkey_only' | 'floating_button';

export type ContextProfile = 'global' | 'vscode' | 'figma' | 'premiere' | 'chrome';

export interface UserFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  isPinnedToRadial?: boolean;
  radialSlot?: number;
  itemCount?: number;
}

export interface RadialItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: string; // Lucide icon name
  color?: string; // Hex or theme accent
  type: RadialItemType;
  description?: string;
  shortcutKey?: string; // e.g. "1", "W", "Q"
  directionHint?: string; // e.g. "N", "NE", "E", "SE", "S", "SW", "W", "NW"
  
  // Specific payloads
  toolId?: string; // e.g. "calculator", "notes", "palette", "timer", "formatter"
  fileId?: string; // id of user file if type === 'file'
  folderId?: string; // id of user folder if type === 'folder'
  textAction?: 'uppercase' | 'lowercase' | 'capitalize' | 'slugify' | 'summarize' | 'json_format' | 'copy_all' | 'clear';
  systemAction?: 'toggle_theme' | 'fullscreen' | 'drill_mode' | 'customize' | 'files_hub' | 'clear_canvas' | 'open_native_modal' | 'benchmark' | 'packs';
  customPayload?: string;
  
  // Nested sub-menu children / folder contents
  children?: RadialItem[];
}

export interface UserFile {
  id: string;
  name: string;
  size: number;
  type: string; // MIME type or extension
  lastModified: number;
  content: string; // Text content, JSON string, or dataURL for image
  folderId?: string; // Optional folder association
  isPinnedToRadial?: boolean;
  radialSlot?: number;
  tags?: string[];
  color?: string;
}

export interface RadialSettings {
  theme: RadialTheme;
  outerRadius: number; // e.g. 175
  innerRadius: number; // e.g. 60
  centerDeadzone: number; // e.g. 42
  soundEnabled: boolean; // default false, 0 added latency
  activationTrigger: ActivationTrigger;
  holdToSelect: boolean; // if true, mouseup triggers hovered item
  holdToFlickMode: boolean; // press and hold -> flick -> release action execution without requiring a second click
  showDirectionLine: boolean;
  showDirectionHints: boolean; // faint flick-direction hints for beginners (N, NE, E...)
  hapticBlip: boolean;
  sectorCount: number; // 6, 8, 10, 12, 14, 16, or dynamic
  autoFitSectors: boolean; // automatically adjust sectors based on items count
  showAddSlotButton: boolean; // show "+ Add Slot" wedge if available slots
  customHotkeysEnabled: boolean;
  // Accessibility
  reducedMotion: boolean; // eliminates spin/spring animation delays
  highContrastMode: boolean; // pure black & stark luminescent contrast
  // Active Context
  activeContext: ContextProfile; // 'global' | 'vscode' | 'figma' | 'premiere' | 'chrome'
  // Mouse Flick Gestures
  flickGestureEnabled: boolean; // Enables quick mouse drag / stroke flick activation without clicking
  flickSensitivity: 'high' | 'normal' | 'relaxed'; // Velocity & threshold preset
  // Custom Branding
  customRadialName: string; // User-defined name for their radial menu
  customRadialLogoUrl?: string; // Custom image logo (base64 data-url or image path)
  customRadialLogoIcon?: string; // Fallback or vector icon choice
  customRadialTagline?: string; // Custom subtitle or tagline
}

export interface DrillResult {
  targetLabel: string;
  direction: string;
  timeMs: number;
  success: boolean;
  rank: 'S' | 'A' | 'B' | 'C';
}

export interface WheelPack {
  id: string;
  name: string;
  author: string;
  description: string;
  context: ContextProfile;
  icon: string;
  accentColor: string;
  items: RadialItem[];
}

export interface SpeedBenchmarkData {
  method: string;
  timeSeconds: number;
  stepsCount: number;
  cognitiveLoad: 'High' | 'Medium' | 'Low' | 'Zero (Kinetic)';
  fittsDistance: string;
}

