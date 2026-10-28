import React, { useState } from 'react';
import { RadialItem, RadialSettings, RadialTheme, ActivationTrigger, UserFolder } from '../../types/radial';
import { DEFAULT_ROOT_MENU, DEFAULT_SETTINGS } from '../../data/defaultRadialData';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  MousePointer,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  FolderPlus,
  Folder,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface RadialCustomizerModalProps {
  isOpen: boolean;
  settings: RadialSettings;
  menuItems: RadialItem[];
  folders: UserFolder[];
  onClose: () => void;
  onUpdateSettings: (newSettings: RadialSettings) => void;
  onUpdateMenuItems: (newItems: RadialItem[]) => void;
  onAddFolder: (folder: UserFolder) => void;
}

const THEMES: { id: RadialTheme; name: string; color: string; desc: string }[] = [
  { id: 'obsidian', name: 'Obsidian Sky', color: '#38bdf8', desc: 'Precision dark slate with electric cyan glow' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', color: '#facc15', desc: 'High-voltage contrast with hot magenta & yellow' },
  { id: 'nord', name: 'Nordic Frost', color: '#2dd4bf', desc: 'Arctic deep blue with mint aurora accents' },
  { id: 'emerald', name: 'Matrix Emerald', color: '#10b981', desc: 'Deep biome obsidian with cyber green glow' },
  { id: 'amber', name: 'Twilight Amber', color: '#f59e0b', desc: 'Warm stone dark with golden amber radiant glow' },
];

const TRIGGERS: { id: ActivationTrigger; label: string; desc: string }[] = [
  { id: 'right_click', label: 'Right-Click Anywhere', desc: 'Opens directly under cursor tip everywhere' },
  { id: 'space_drag', label: 'Space + Drag', desc: 'Hold Spacebar and move mouse (Blender/Maya style)' },
  { id: 'middle_click', label: 'Middle Mouse Click', desc: 'Scroll wheel click at pointer' },
  { id: 'floating_button', label: 'Floating Quick Orb', desc: 'Click the on-screen glowing orb trigger' },
];

const SLOT_COUNT_PRESETS = [6, 8, 10, 12, 14, 16];

export const RadialCustomizerModal: React.FC<RadialCustomizerModalProps> = ({
  isOpen,
  settings,
  menuItems,
  folders,
  onClose,
  onUpdateSettings,
  onUpdateMenuItems,
  onAddFolder,
}) => {
  const [activeTab, setActiveTab] = useState<'slots' | 'branding' | 'appearance' | 'triggers'>('slots');
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotType, setNewSlotType] = useState<'folder' | 'tool' | 'custom_command'>('folder');
  const [newSlotIcon, setNewSlotIcon] = useState('Folder');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [newSubOptionLabel, setNewSubOptionLabel] = useState('');
  const logoFileRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
    onUpdateMenuItems(DEFAULT_ROOT_MENU);
    soundManager.playActionChime(true);
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotLabel.trim()) return;

    if (newSlotType === 'folder') {
      const folderId = `folder-created-${Date.now()}`;
      const newFolder: UserFolder = {
        id: folderId,
        name: newSlotLabel.trim(),
        color: '#38bdf8',
        icon: 'Folder',
        isPinnedToRadial: true,
        description: 'Custom folder with suboptions',
      };
      onAddFolder(newFolder);

      const newSlot: RadialItem = {
        id: `slot-folder-${folderId}`,
        label: newSlotLabel.trim(),
        shortLabel: `📁 ${newSlotLabel.trim().slice(0, 8)}`,
        icon: 'Folder',
        color: '#38bdf8',
        type: 'folder',
        folderId,
        shortcutKey: String((menuItems.length % 9) + 1),
        description: 'Folder: Click or flick to open suboptions',
        children: [
          {
            id: `sub-${Date.now()}-1`,
            label: 'Quick Note',
            icon: 'PenTool',
            color: '#10b981',
            type: 'tool',
            toolId: 'notes',
            shortcutKey: '1',
            description: 'Note inside this folder',
          },
        ],
      };
      onUpdateMenuItems([...menuItems, newSlot]);
    } else {
      const newSlot: RadialItem = {
        id: `custom-slot-${Date.now()}`,
        label: newSlotLabel.trim(),
        shortLabel: newSlotLabel.trim().slice(0, 8),
        icon: newSlotType === 'tool' ? 'Wrench' : 'Sparkles',
        color: '#fbbf24',
        type: newSlotType,
        shortcutKey: String((menuItems.length % 9) + 1),
        description: 'Custom slot command',
        toolId: newSlotType === 'tool' ? 'calculator' : undefined,
      };
      onUpdateMenuItems([...menuItems, newSlot]);
    }

    setNewSlotLabel('');
    soundManager.playActionChime(true);
  };

  const handleDeleteSlot = (id: string) => {
    onUpdateMenuItems(menuItems.filter((m) => m.id !== id));
    soundManager.playHoverTick(1);
  };

  const handleAddSubOption = (parentSlotId: string) => {
    if (!newSubOptionLabel.trim()) return;

    const updated = menuItems.map((item) => {
      if (item.id === parentSlotId) {
        const children = item.children || [];
        const newChild: RadialItem = {
          id: `child-${Date.now()}`,
          label: newSubOptionLabel.trim(),
          icon: 'Sparkles',
          color: '#38bdf8',
          type: 'custom_command',
          shortcutKey: String((children.length % 9) + 1),
          description: 'Suboption command',
        };
        return {
          ...item,
          children: [...children, newChild],
        };
      }
      return item;
    });

    onUpdateMenuItems(updated);
    setNewSubOptionLabel('');
    soundManager.playActionChime(true);
  };

  const handleDeleteSubOption = (parentSlotId: string, childId: string) => {
    const updated = menuItems.map((item) => {
      if (item.id === parentSlotId) {
        return {
          ...item,
          children: (item.children || []).filter((c) => c.id !== childId),
        };
      }
      return item;
    });
    onUpdateMenuItems(updated);
    soundManager.playHoverTick(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Radial Wheel & Slots Customizer</h2>
              <p className="text-xs text-slate-400">Configure number of slots, folder suboptions, and cursor behavior</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'slots'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Wheel Slots ({menuItems.length}) & Folders
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'branding'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Logo & Name
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Themes & Radius
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'triggers'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Cursor Spawn & Triggers
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'slots' && (
            <div className="space-y-6">
              {/* Slot Capacity selector */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-white block">Wheel Slots Capacity</label>
                    <span className="text-[11px] text-slate-400">
                      Choose how many wedges your radial wheel divides into
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {menuItems.length} active items
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {SLOT_COUNT_PRESETS.map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        onUpdateSettings({ ...settings, sectorCount: count });
                        soundManager.playHoverTick(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                        settings.sectorCount === count
                          ? 'border-sky-500 bg-sky-950 text-sky-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count} Slots
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300">Show "+ Add Slot" wedge directly in wheel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showAddSlotButton}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, showAddSlotButton: e.target.checked })
                    }
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Add New Slot or Folder Form */}
              <form onSubmit={handleAddSlot} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Add New Slot / Folder</span>
                  <span className="text-[10px] text-sky-400 font-mono">Folders open suboptions</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Slot label or Folder name..."
                    value={newSlotLabel}
                    onChange={(e) => setNewSlotLabel(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <select
                    value={newSlotType}
                    onChange={(e) =>
                      setNewSlotType(e.target.value as 'folder' | 'tool' | 'custom_command')
                    }
                    className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="folder">📁 Folder (Suboptions)</option>
                    <option value="tool">🛠️ Tool</option>
                    <option value="custom_command">⚡ Command</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slot</span>
                  </button>
                </div>
              </form>

              {/* Current Slots List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Active Radial Wedges ({menuItems.length})
                </span>

                {menuItems.map((item, idx) => {
                  const isFolder = item.type === 'folder' || item.type === 'sub_menu';
                  const isExpanded = expandedFolderId === item.id;
                  const childrenCount = item.children?.length || 0;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                    >
                      <div className="p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}</span>
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color || '#38bdf8' }}
                          >
                            {isFolder ? <Folder className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                              {isFolder && (
                                <span className="text-[10px] text-sky-400 bg-sky-950 border border-sky-800 px-1.5 py-0.2 rounded font-mono">
                                  {childrenCount} suboption{childrenCount === 1 ? '' : 's'}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{item.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isFolder && (
                            <button
                              onClick={() => setExpandedFolderId(isExpanded ? null : item.id)}
                              className="px-2 py-1 text-xs text-sky-400 hover:text-white bg-slate-900 border border-slate-800 rounded-md flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'Edit Suboptions'}</span>
                              <ChevronRight
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSlot(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Folder Suboptions Drawer */}
                      {isFolder && isExpanded && (
                        <div className="p-3 bg-slate-900/80 border-t border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span className="font-semibold text-sky-300">
                              Suboptions inside &quot;{item.label}&quot; (opened in radial wheel)
                            </span>
                            <span className="text-slate-400 font-mono">{childrenCount} items</span>
                          </div>

                          {/* Add SubOption Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="New suboption name..."
                              value={newSubOptionLabel}
                              onChange={(e) => setNewSubOptionLabel(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white placeholder-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSubOption(item.id)}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded font-medium"
                            >
                              + Add Suboption
                            </button>
                          </div>

                          {/* SubOptions list */}
                          <div className="space-y-1">
                            {item.children?.map((ch, cIdx) => (
                              <div
                                key={ch.id}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-slate-500">{cIdx + 1}</span>
                                  <span className="text-slate-200">{ch.label}</span>
                                  <span className="text-[10px] text-slate-500">({ch.type})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubOption(item.id, ch.id)}
                                  className="text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Radial Menu Name / Title
                </label>
                <input
                  type="text"
                  value={settings.customRadialName}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, customRadialName: e.target.value })
                  }
                  placeholder="e.g. nearly, Studio Wheel..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  value={settings.customRadialTagline || ''}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, customRadialTagline: e.target.value })
                  }
                  placeholder="e.g. Quick Tool & File Interface"
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Custom Center Hub Logo
                </label>
                <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {settings.customRadialLogoUrl ? (
                      <img
                        src={settings.customRadialLogoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-mono text-slate-500">No Image</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg"
                      >
                        Upload Custom Logo
                      </button>
                      {settings.customRadialLogoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings({ ...settings, customRadialLogoUrl: undefined })
                          }
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:text-white"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            onUpdateSettings({
                              ...settings,
                              customRadialLogoUrl: ev.target?.result as string,
                            });
                            soundManager.playActionChime(true);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-[11px] text-slate-400">
                      Upload any image (PNG, JPG, SVG). It appears in your radial center hub and top bar!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Color Profile</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => {
                        onUpdateSettings({ ...settings, theme: th.id });
                        soundManager.playHoverTick(0);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        settings.theme === th.id
                          ? 'border-sky-500 bg-sky-950/30'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-sm"
                        style={{ backgroundColor: th.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{th.name}</span>
                          {settings.theme === th.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{th.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius Geometry Sliders */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Outer Wheel Radius</label>
                  <span className="text-xs font-mono text-sky-400">{settings.outerRadius}px</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="220"
                  step="5"
                  value={settings.outerRadius}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, outerRadius: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-500"
                />

                <div className="flex items-center justify-between pt-2">
                  <label className="text-xs font-medium text-slate-300">Center Deadzone Hub</label>
                  <span className="text-xs font-mono text-sky-400">{settings.centerDeadzone}px</span>
                </div>
                <input
                  type="range"
                  min="36"
                  max="65"
                  step="2"
                  value={settings.centerDeadzone}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, centerDeadzone: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-6">
              {/* Cursor Centering Guarantee Banner */}
              <div className="p-3.5 bg-sky-950/40 border border-sky-800/80 rounded-xl flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="text-xs text-sky-200">
                  <strong className="text-white block mb-0.5">Cursor Center Alignment Active</strong>
                  Whenever you Right-Click or press Space, the radial wheel center hub spawns directly under your mouse cursor.
                </div>
              </div>

              {/* Activation Trigger Method */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Primary Gesture</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TRIGGERS.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => {
                        onUpdateSettings({ ...settings, activationTrigger: tr.id });
                        soundManager.playHoverTick(0);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.activationTrigger === tr.id
                          ? 'border-sky-500 bg-sky-950/30'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{tr.label}</span>
                        {settings.activationTrigger === tr.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{tr.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-sky-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <span className="text-xs font-medium text-white block">Acoustic Tactile Feedback</span>
                      <span className="text-[11px] text-slate-400">
                        Plays procedural synthesizer clicks on sector hover and trigger
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      soundManager.enabled = enabled;
                      onUpdateSettings({ ...settings, soundEnabled: enabled });
                    }}
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-xs font-medium text-white block">Directional Pointer Vector</span>
                      <span className="text-[11px] text-slate-400">
                        Displays laser needle pointing directly toward your cursor
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showDirectionLine}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, showDirectionLine: e.target.checked })
                    }
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>

                {/* Mouse-Flick Gesture Controls */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Mouse-Flick Gesture Activation
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Dragging or swiping the cursor quickly selects the wedge without needing a click
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.flickGestureEnabled !== false}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, flickGestureEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                    />
                  </div>

                  {settings.flickGestureEnabled !== false && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Flick Sensitivity</span>
                      <div className="flex items-center gap-1.5">
                        {(['high', 'normal', 'relaxed'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ ...settings, flickSensitivity: lvl });
                              soundManager.playHoverTick(0);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg capitalize transition-colors ${
                              (settings.flickSensitivity || 'normal') === lvl
                                ? 'bg-sky-600 text-white font-semibold'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-xs font-medium text-white block">Hold & Release to Select</span>
                      <span className="text-[11px] text-slate-400">
                        Activate hovered slot immediately upon mouse button release
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.holdToSelect}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, holdToSelect: e.target.checked })
                    }
                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
