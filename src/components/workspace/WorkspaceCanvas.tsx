import React, { useState, useRef } from 'react';
import { UserFile, UserFolder, RadialItem, RadialSettings } from '../../types/radial';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Zap,
  MousePointer2,
  FolderOpen,
  Sliders,
  Copy,
  Check,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Edit2,
  Layers,
  Wrench,
  Terminal,
  Calculator,
  PenTool,
  Clock,
  Palette,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { DynamicIcon } from '../common/DynamicIcon';
import { soundManager } from '../../utils/audio';

interface WorkspaceCanvasProps {
  files: UserFile[];
  folders: UserFolder[];
  menuItems: RadialItem[];
  settings: RadialSettings;
  onUpdateSettings: (settings: RadialSettings) => void;
  onUpdateMenuItems: (items: RadialItem[]) => void;
  onAddFolder: (folder: UserFolder) => void;
  onOpenRadialAt: (x: number, y: number) => void;
  onOpenFile: (file: UserFile) => void;
  onOpenFilesHub: () => void;
  onOpenDrill: () => void;
  onOpenCustomizer: () => void;
  onDropFiles: (files: FileList) => void;
  lastActionMessage: string | null;
  bufferText: string;
  setBufferText: (text: string) => void;
}

const PRESET_ICONS = ['Compass', 'Zap', 'Flame', 'Cpu', 'Terminal', 'Sparkles', 'Layers', 'Code'];
const PRESET_COLORS = ['#38bdf8', '#a855f7', '#fbbf24', '#10b981', '#f43f5e', '#ec4899', '#f97316', '#6366f1'];

export const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  files,
  folders,
  menuItems,
  settings,
  onUpdateSettings,
  onUpdateMenuItems,
  onAddFolder,
  onOpenRadialAt,
  onOpenFile,
  onOpenFilesHub,
  onOpenDrill,
  onOpenCustomizer,
  onDropFiles,
  lastActionMessage,
  bufferText,
  setBufferText,
}) => {
  const [activeTab, setActiveTab] = useState<'slots_builder' | 'sandbox' | 'branding'>('slots_builder');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Background Creator State (Add not at the radial itself)
  const [newSlotType, setNewSlotType] = useState<'folder' | 'tool' | 'file' | 'custom_command'>('folder');
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotColor, setNewSlotColor] = useState('#38bdf8');
  const [selectedFileForSlot, setSelectedFileForSlot] = useState<string>('');
  const [selectedToolForSlot, setSelectedToolForSlot] = useState<string>('calculator');
  const [selectedFolderForSuboptions, setSelectedFolderForSuboptions] = useState<RadialItem | null>(null);
  const [newSuboptionLabel, setNewSuboptionLabel] = useState('');

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSettings({
        ...settings,
        customRadialLogoUrl: dataUrl,
      });
      soundManager.playActionChime(true);
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    onUpdateSettings({
      ...settings,
      customRadialLogoUrl: undefined,
    });
    soundManager.playHoverTick(0);
  };

  // Add slot directly from background interface
  const handleAddSlotFromBackground = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotLabel.trim()) return;

    if (newSlotType === 'folder') {
      const folderId = `folder-${Date.now()}`;
      const newFolder: UserFolder = {
        id: folderId,
        name: newSlotLabel.trim(),
        color: newSlotColor,
        icon: 'Folder',
        isPinnedToRadial: true,
        description: 'Folder with custom suboptions',
      };
      onAddFolder(newFolder);

      const newSlot: RadialItem = {
        id: `slot-folder-${folderId}`,
        label: newSlotLabel.trim(),
        shortLabel: `📁 ${newSlotLabel.trim().slice(0, 8)}`,
        icon: 'Folder',
        color: newSlotColor,
        type: 'folder',
        folderId,
        shortcutKey: String((menuItems.length % 9) + 1),
        description: 'Folder: Click or flick to open suboptions',
        children: [
          {
            id: `sub-init-${Date.now()}`,
            label: 'Quick Note',
            icon: 'PenTool',
            color: '#10b981',
            type: 'tool',
            toolId: 'notes',
            shortcutKey: '1',
            description: 'Note inside folder',
          },
        ],
      };
      onUpdateMenuItems([...menuItems, newSlot]);
    } else if (newSlotType === 'file') {
      const targetFile = files.find((f) => f.id === selectedFileForSlot) || files[0];
      const newSlot: RadialItem = {
        id: `slot-file-${Date.now()}`,
        label: targetFile ? targetFile.name : newSlotLabel.trim(),
        shortLabel: targetFile ? targetFile.name.slice(0, 8) : newSlotLabel.trim().slice(0, 8),
        icon: 'FileText',
        color: newSlotColor,
        type: 'file',
        fileId: targetFile?.id,
        shortcutKey: String((menuItems.length % 9) + 1),
        description: targetFile ? `Custom File: ${targetFile.name}` : 'Custom file slot',
      };
      onUpdateMenuItems([...menuItems, newSlot]);
    } else if (newSlotType === 'tool') {
      const toolIcons: Record<string, string> = {
        calculator: 'Calculator',
        notes: 'PenTool',
        palette: 'Palette',
        timer: 'Clock',
      };
      const newSlot: RadialItem = {
        id: `slot-tool-${Date.now()}`,
        label: newSlotLabel.trim(),
        shortLabel: newSlotLabel.trim().slice(0, 8),
        icon: toolIcons[selectedToolForSlot] || 'Wrench',
        color: newSlotColor,
        type: 'tool',
        toolId: selectedToolForSlot,
        shortcutKey: String((menuItems.length % 9) + 1),
        description: `Tool: ${newSlotLabel.trim()}`,
      };
      onUpdateMenuItems([...menuItems, newSlot]);
    } else {
      const newSlot: RadialItem = {
        id: `slot-cmd-${Date.now()}`,
        label: newSlotLabel.trim(),
        shortLabel: newSlotLabel.trim().slice(0, 8),
        icon: 'Sparkles',
        color: newSlotColor,
        type: 'custom_command',
        shortcutKey: String((menuItems.length % 9) + 1),
        description: 'Custom command slot',
      };
      onUpdateMenuItems([...menuItems, newSlot]);
    }

    setNewSlotLabel('');
    soundManager.playActionChime(true);
  };

  // Reordering slots
  const handleMoveSlot = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= menuItems.length) return;

    const updated = [...menuItems];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // re-assign shortcut keys
    updated.forEach((item, idx) => {
      item.shortcutKey = String((idx % 9) + 1);
    });

    onUpdateMenuItems(updated);
    soundManager.playHoverTick(0);
  };

  // Delete slot
  const handleDeleteSlot = (id: string) => {
    const updated = menuItems.filter((item) => item.id !== id);
    updated.forEach((item, idx) => {
      item.shortcutKey = String((idx % 9) + 1);
    });
    onUpdateMenuItems(updated);
    soundManager.playHoverTick(1);
    if (selectedFolderForSuboptions?.id === id) {
      setSelectedFolderForSuboptions(null);
    }
  };

  // Add suboption into folder from background interface
  const handleAddSuboptionFromBackground = (folderSlotId: string) => {
    if (!newSuboptionLabel.trim()) return;

    const updated = menuItems.map((item) => {
      if (item.id === folderSlotId) {
        const children = item.children || [];
        const newChild: RadialItem = {
          id: `child-${Date.now()}`,
          label: newSuboptionLabel.trim(),
          icon: 'Sparkles',
          color: item.color || '#38bdf8',
          type: 'custom_command',
          shortcutKey: String((children.length % 9) + 1),
          description: `Suboption inside ${item.label}`,
        };
        const updatedItem = {
          ...item,
          children: [...children, newChild],
        };
        setSelectedFolderForSuboptions(updatedItem);
        return updatedItem;
      }
      return item;
    });

    onUpdateMenuItems(updated);
    setNewSuboptionLabel('');
    soundManager.playActionChime(true);
  };

  const handleCopyBuffer = () => {
    navigator.clipboard.writeText(bufferText);
    setCopied(true);
    soundManager.playActionChime(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-6 select-none"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) {
          onDropFiles(e.dataTransfer.files);
        }
      }}
    >
      {/* Background Interface Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md">
        {/* Left: Branding Quick Info & Name Field */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                {settings.customRadialLogoUrl ? (
                  <img
                    src={settings.customRadialLogoUrl}
                    alt="Custom Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <DynamicIcon
                    name={settings.customRadialLogoIcon || 'Compass'}
                    className="w-5 h-5 text-sky-400"
                  />
                )}
              </div>
            </div>
            <button
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-md text-[10px]"
              title="Upload your own Logo for Radial Menu"
            >
              <ImageIcon className="w-3 h-3" />
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.customRadialName}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    customRadialName: e.target.value || 'nearly',
                  })
                }
                placeholder="Name your Radial..."
                className="text-base font-bold text-white bg-transparent hover:bg-slate-800/60 focus:bg-slate-950 focus:ring-1 focus:ring-sky-500 px-2 py-0.5 rounded-lg border border-transparent focus:border-sky-500 transition-colors w-44 sm:w-56"
                title="Click to rename your radial menu"
              />
              <span className="text-[10px] text-sky-400 font-mono bg-sky-950 border border-sky-800/80 px-2 py-0.5 rounded-full">
                {menuItems.length} Wedges
              </span>
            </div>
            <p className="text-[11px] text-slate-400 px-2">
              {settings.customRadialTagline || 'Right-click anywhere to trigger at your cursor'}
            </p>
          </div>
        </div>

        {/* Right: Background Deck Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('slots_builder')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'slots_builder'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Background Slots Deck</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'branding'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Logo & Style</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Sandbox</span>
            </button>
          </div>

          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onOpenRadialAt(rect.left + rect.width / 2, rect.top - 120);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            title="Summon Radial Menu at cursor"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Wheel</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BACKGROUND SLOTS BUILDER & MANAGEMENT */}
      {activeTab === 'slots_builder' && (
        <div className="flex flex-col gap-6">
          {/* Add Slot Panel right on background interface */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Add New Wedge to Radial Menu (From Background)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Choose type below to add directly into your wheel
              </span>
            </div>

            {/* Type selector tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewSlotType('folder');
                  setNewSlotLabel('My New Folder');
                  setNewSlotColor('#38bdf8');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  newSlotType === 'folder'
                    ? 'border-sky-500 bg-sky-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <Folder className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-semibold block">📁 Folder</span>
                  <span className="text-[10px] text-slate-400">Opens suboptions</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewSlotType('file');
                  if (files.length > 0) {
                    setSelectedFileForSlot(files[0].id);
                    setNewSlotLabel(files[0].name);
                  }
                  setNewSlotColor('#10b981');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  newSlotType === 'file'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold block">📄 Custom File</span>
                  <span className="text-[10px] text-slate-400">1-click editor</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewSlotType('tool');
                  setNewSlotLabel('Quick Tool');
                  setNewSlotColor('#fbbf24');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  newSlotType === 'tool'
                    ? 'border-amber-500 bg-amber-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold block">🛠️ Tool</span>
                  <span className="text-[10px] text-slate-400">Calc, Notes, Timer</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewSlotType('custom_command');
                  setNewSlotLabel('Custom Action');
                  setNewSlotColor('#a855f7');
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  newSlotType === 'custom_command'
                    ? 'border-purple-500 bg-purple-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-semibold block">⚡ Action</span>
                  <span className="text-[10px] text-slate-400">Command / transform</span>
                </div>
              </button>
            </div>

            {/* Input Form based on selected type */}
            <form onSubmit={handleAddSlotFromBackground} className="flex flex-wrap gap-3 items-center">
              {newSlotType === 'file' ? (
                <div className="flex-1 min-w-[200px] flex gap-2">
                  <select
                    value={selectedFileForSlot}
                    onChange={(e) => {
                      setSelectedFileForSlot(e.target.value);
                      const f = files.find((file) => file.id === e.target.value);
                      if (f) setNewSlotLabel(f.name);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>
                        📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </option>
                    ))}
                  </select>
                </div>
              ) : newSlotType === 'tool' ? (
                <div className="flex-1 min-w-[200px] flex gap-2">
                  <select
                    value={selectedToolForSlot}
                    onChange={(e) => {
                      setSelectedToolForSlot(e.target.value);
                      const names: Record<string, string> = {
                        calculator: 'Calculator',
                        notes: 'Quick Notes',
                        palette: 'Color Lab',
                        timer: 'Focus Timer',
                      };
                      setNewSlotLabel(names[e.target.value] || 'Tool');
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="calculator">🧮 Calculator</option>
                    <option value="notes">📝 Quick Scratchpad</option>
                    <option value="palette">🎨 Color Lab & Eyedropper</option>
                    <option value="timer">⏱️ Focus Timer</option>
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={newSlotType === 'folder' ? 'Folder Name (opens suboptions)' : 'Slot Label...'}
                  value={newSlotLabel}
                  onChange={(e) => setNewSlotLabel(e.target.value)}
                  className="flex-1 min-w-[200px] px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              )}

              {/* Color swatches */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400">Color:</span>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewSlotColor(c)}
                    className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                    style={{
                      backgroundColor: c,
                      border: newSlotColor === c ? '2px solid #ffffff' : 'none',
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Wedge Slot</span>
              </button>
            </form>
          </div>

          {/* Current Slots Deck (Live interactive wedge cards) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Current Radial Wheel Layout ({menuItems.length} Wedges Active)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Reorder wedges or click any folder to inspect its suboptions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {menuItems.map((item, idx) => {
                const isFolder = item.type === 'folder' || item.type === 'sub_menu';
                const childrenCount = item.children?.length || 0;
                const isSelected = selectedFolderForSuboptions?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/30 shadow-lg shadow-sky-950/50'
                        : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top slot indicator & move controls */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          Slot {idx + 1} · Key [{item.shortcutKey || idx + 1}]
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveSlot(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Move earlier in radial wheel"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveSlot(idx, 'right')}
                            disabled={idx === menuItems.length - 1}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500"
                            title="Move later in radial wheel"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 ml-1"
                            title="Remove from radial"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Wedge Content */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                          style={{ backgroundColor: item.color || '#38bdf8' }}
                        >
                          <DynamicIcon name={item.icon || (isFolder ? 'Folder' : 'Circle')} size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white block truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                            {item.description || item.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Folder suboptions button or target indicator */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      {isFolder ? (
                        <button
                          onClick={() =>
                            setSelectedFolderForSuboptions(isSelected ? null : item)
                          }
                          className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                        >
                          <span>📁 {childrenCount} Suboptions</span>
                          <span>{isSelected ? '▲' : '▼'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 capitalize">{item.type}</span>
                      )}

                      <span className="text-[10px] text-slate-500 font-mono">
                        {((360 / menuItems.length) * idx).toFixed(0)}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suboptions Manager Drawer for the selected folder */}
          {selectedFolderForSuboptions && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-800/80 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-sky-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Suboptions inside &quot;{selectedFolderForSuboptions.label}&quot;
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      When this folder is clicked in the radial menu, it expands into these suboptions!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFolderForSuboptions(null)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg"
                >
                  Done
                </button>
              </div>

              {/* Add suboption form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New suboption name..."
                  value={newSuboptionLabel}
                  onChange={(e) => setNewSuboptionLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSuboptionFromBackground(selectedFolderForSuboptions.id)}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl"
                >
                  + Add to Folder
                </button>
              </div>

              {/* List of suboptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectedFolderForSuboptions.children?.map((child, cIdx) => (
                  <div
                    key={child.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500">{cIdx + 1}</span>
                      <DynamicIcon name={child.icon || 'Sparkles'} size={14} color={child.color} />
                      <span className="text-white font-medium truncate">{child.label}</span>
                    </div>

                    <button
                      onClick={() => {
                        const updated = menuItems.map((item) => {
                          if (item.id === selectedFolderForSuboptions.id) {
                            const remaining = (item.children || []).filter((c) => c.id !== child.id);
                            const updatedParent = { ...item, children: remaining };
                            setSelectedFolderForSuboptions(updatedParent);
                            return updatedParent;
                          }
                          return item;
                        });
                        onUpdateMenuItems(updated);
                        soundManager.playHoverTick(0);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BRANDING & LOGO CUSTOMIZER */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo & Identity Form */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Radial Menu Identity & Logo</h3>
              <p className="text-xs text-slate-400">
                Customize your menu&apos;s brand, center logo, and title that appears in the center hub
              </p>
            </div>

            {/* Radial Name input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Radial Menu Title
              </label>
              <input
                type="text"
                value={settings.customRadialName}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, customRadialName: e.target.value })
                }
                placeholder="e.g. OrbitRadial, Studio Wheel..."
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Tagline input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Subtitle / Tagline
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

            {/* Custom Logo Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Center Hub Logo (Image Upload)
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {settings.customRadialLogoUrl ? (
                    <img
                      src={settings.customRadialLogoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DynamicIcon
                      name={settings.customRadialLogoIcon || 'Compass'}
                      className="w-6 h-6 text-sky-400"
                    />
                  )}
                </div>

                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                  </button>

                  {settings.customRadialLogoUrl && (
                    <button
                      onClick={handleClearLogo}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fallback Vector Icons */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Or Select Vector Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        customRadialLogoIcon: iconName,
                        customRadialLogoUrl: undefined, // switch to icon
                      });
                      soundManager.playHoverTick(0);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      settings.customRadialLogoIcon === iconName && !settings.customRadialLogoUrl
                        ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <DynamicIcon name={iconName} size={18} />
                    <span className="text-[10px]">{iconName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-4">
              Center Hub Live Preview
            </span>

            <div className="w-40 h-40 rounded-full border-2 border-sky-500/40 bg-slate-950/90 shadow-2xl flex flex-col items-center justify-center p-3 relative">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mb-1.5 border border-sky-400/30">
                {settings.customRadialLogoUrl ? (
                  <img
                    src={settings.customRadialLogoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <DynamicIcon
                    name={settings.customRadialLogoIcon || 'Compass'}
                    className="w-7 h-7 text-sky-400 animate-spin-slow"
                  />
                )}
              </div>
              <span className="text-xs font-bold text-white tracking-tight line-clamp-1 max-w-[110px]">
                {settings.customRadialName || 'nearly'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                {menuItems.length} slots · [ESC]
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-6 max-w-xs">
              This exact logo and name appear in your radial menu center hub whenever summoned anywhere!
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: TEXT SANDBOX & INTERACTIVE CANVAS */}
      {activeTab === 'sandbox' && (
        <div
          className={`flex-1 min-h-[420px] rounded-2xl border transition-all flex flex-col overflow-hidden shadow-2xl relative ${
            isDraggingOver
              ? 'border-sky-400 bg-sky-950/20 shadow-sky-950/50'
              : 'border-slate-800 bg-slate-900/50 backdrop-blur-sm'
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenRadialAt(e.clientX, e.clientY);
          }}
        >
          {/* Canvas Header */}
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-tight">
                Interactive Text Sandbox & Action Tester
              </span>
            </div>

            <div className="flex items-center gap-3">
              {lastActionMessage && (
                <span className="text-xs text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>{lastActionMessage}</span>
                </span>
              )}

              <button
                onClick={handleCopyBuffer}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Copy text buffer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick summon hint */}
          <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>
                <strong className="text-white">Mouse-Flick Active:</strong> Right-Click anywhere or press{' '}
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[10px]">
                  Space
                </kbd>
                , then <strong>flick/drag your cursor in any direction</strong> to instantly select that wedge without clicking!
              </span>
            </div>
          </div>

          {/* Text Area */}
          <div className="flex-1 flex flex-col p-4 bg-slate-950/60 relative">
            <textarea
              value={bufferText}
              onChange={(e) => setBufferText(e.target.value)}
              onContextMenu={(e) => {
                e.preventDefault();
                onOpenRadialAt(e.clientX, e.clientY);
              }}
              placeholder="Highlight any words here and right-click to apply transforms or inspect your files!"
              className="flex-1 w-full bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed select-text"
              spellCheck={false}
            />

            {isDraggingOver && (
              <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm border-2 border-dashed border-sky-400 rounded-xl flex flex-col items-center justify-center text-sky-200 gap-2">
                <UploadCloud className="w-10 h-10 animate-bounce" />
                <p className="text-sm font-semibold">Drop files here to import into your Vault</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
