import React, { useState, useRef } from 'react';
import { UserFile, UserFolder } from '../../types/radial';
import {
  X,
  Upload,
  FileText,
  FilePlus,
  Trash2,
  Eye,
  Pin,
  PinOff,
  Search,
  CheckCircle2,
  HardDrive,
  FolderPlus,
  Folder,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface FileManagerModalProps {
  isOpen: boolean;
  files: UserFile[];
  folders: UserFolder[];
  onClose: () => void;
  onAddFiles: (newFiles: UserFile[]) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenFile: (file: UserFile) => void;
  onTogglePinFile: (fileId: string) => void;
  onUpdateFileColor: (fileId: string, color: string) => void;
  onAddFolder: (folder: UserFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onTogglePinFolder: (folderId: string) => void;
  onMoveFileToFolder: (fileId: string, folderId?: string) => void;
}

const ACCENT_COLORS = ['#38bdf8', '#fbbf24', '#a855f7', '#10b981', '#f43f5e', '#ec4899', '#f97316', '#6366f1'];

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  files,
  folders,
  onClose,
  onAddFiles,
  onDeleteFile,
  onOpenFile,
  onTogglePinFile,
  onUpdateFileColor,
  onAddFolder,
  onDeleteFolder,
  onTogglePinFolder,
  onMoveFileToFolder,
}) => {
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelection = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const loadedFiles: UserFile[] = [];
    const promises: Promise<void>[] = [];

    Array.from(fileList).forEach((file, index) => {
      const p = new Promise<void>((resolve) => {
        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');

        reader.onload = (e) => {
          const content = (e.target?.result as string) || '';
          loadedFiles.push({
            id: `custom-file-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            lastModified: file.lastModified,
            content,
            folderId: selectedFolderId !== 'all' ? selectedFolderId : undefined,
            isPinnedToRadial: true,
            color: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
            tags: [file.name.split('.').pop() || 'file'],
          });
          resolve();
        };

        if (isImage) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });
      promises.push(p);
    });

    Promise.all(promises).then(() => {
      onAddFiles(loadedFiles);
      soundManager.playActionChime(true);
    });
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: UserFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
      icon: 'Folder',
      isPinnedToRadial: true,
      description: 'Custom user folder with suboptions',
    };

    onAddFolder(newFolder);
    setNewFolderName('');
    setIsCreatingFolder(false);
    setSelectedFolderId(newFolder.id);
    soundManager.playActionChime(true);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const ext = newFileName.includes('.') ? newFileName.split('.').pop() : 'txt';
    const newFile: UserFile = {
      id: `file-created-${Date.now()}`,
      name: newFileName.trim(),
      size: 0,
      type: ext === 'json' ? 'application/json' : ext === 'md' ? 'text/markdown' : 'text/plain',
      lastModified: Date.now(),
      folderId: selectedFolderId !== 'all' ? selectedFolderId : undefined,
      content: ext === 'json' ? '{\n  "name": "new_config"\n}' : `# ${newFileName}\n\nStart typing here...`,
      isPinnedToRadial: true,
      color: ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)],
      tags: [ext || 'text'],
    };

    onAddFiles([newFile]);
    setNewFileName('');
    setIsCreatingFile(false);
    soundManager.playActionChime(true);
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.tags && f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    const matchesFolder = selectedFolderId === 'all' ? true : f.folderId === selectedFolderId;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Files & Folders Vault</h2>
              <p className="text-xs text-slate-400">
                Organize files into folders. Pinned folders open as dynamic suboptions in your radial wheel!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body with Sidebar Folders + Files Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Folders Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/50 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Folders</span>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                title="Create a new folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Folder</span>
              </button>
            </div>

            {/* Folder creation form */}
            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white mb-2"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded font-medium"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Folders List */}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              <button
                onClick={() => setSelectedFolderId('all')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                  selectedFolderId === 'all'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-sky-400" />
                  <span>All Vault Files</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{files.length}</span>
              </button>

              {folders.map((fld) => {
                const count = files.filter((f) => f.folderId === fld.id).length;
                return (
                  <div
                    key={fld.id}
                    onClick={() => setSelectedFolderId(fld.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition-colors group ${
                      selectedFolderId === fld.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 shrink-0" style={{ color: fld.color || '#38bdf8' }} />
                      <span className="truncate">{fld.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">{count}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinFolder(fld.id);
                        }}
                        className={`p-1 rounded text-[10px] transition-colors ${
                          fld.isPinnedToRadial
                            ? 'text-sky-400 hover:text-sky-300'
                            : 'text-slate-600 hover:text-slate-300'
                        }`}
                        title={
                          fld.isPinnedToRadial
                            ? 'Pinned to radial wheel (opens suboptions)'
                            : 'Pin to radial wheel'
                        }
                      >
                        {fld.isPinnedToRadial ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(fld.id);
                        }}
                        className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Files View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
            {/* Upload Area & Search */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 flex flex-col gap-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelection(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-sky-400 bg-sky-500/10 text-sky-200'
                    : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/40 text-slate-300'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelection(e.target.files)}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-medium text-slate-200">
                    <span className="text-sky-400 underline underline-offset-2">Select files from disk</span> or drag
                    & drop here{' '}
                    {selectedFolderId !== 'all' && (
                      <span className="text-slate-400 font-mono">
                        (adds into {folders.find((f) => f.id === selectedFolderId)?.name})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isCreatingFile ? (
                    <form onSubmit={handleCreateFile} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="e.g. notes.md or script.js"
                        autoFocus
                        className="px-3 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingFile(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingFile(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <FilePlus className="w-3.5 h-3.5 text-sky-400" />
                      <span>New Blank File</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Files List */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950/60">
              {filteredFiles.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <FileText className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No files in this folder or search match.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredFiles.map((file) => {
                    const currentFolder = folders.find((f) => f.id === file.folderId);
                    return (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md"
                              style={{ backgroundColor: file.color || '#38bdf8' }}
                            >
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className="font-medium text-slate-100 text-xs truncate max-w-[150px]"
                                  title={file.name}
                                >
                                  {file.name}
                                </h4>
                                {file.isPinnedToRadial && (
                                  <span className="text-[9px] text-sky-400 bg-sky-950 border border-sky-800 px-1 rounded flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5 inline" /> Radial
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB · {new Date(file.lastModified).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onTogglePinFile(file.id)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                file.isPinnedToRadial
                                  ? 'border-sky-700 bg-sky-950 text-sky-300 hover:bg-sky-900'
                                  : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title={
                                file.isPinnedToRadial
                                  ? 'Unpin from radial wheel'
                                  : 'Pin directly to radial wheel'
                              }
                            >
                              {file.isPinnedToRadial ? (
                                <PinOff className="w-3.5 h-3.5" />
                              ) : (
                                <Pin className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => onOpenFile(file)}
                              className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
                              title="View & Edit File"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteFile(file.id)}
                              className="p-1.5 rounded-lg border border-slate-700 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Move to folder selector & color swatches */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Folder className="w-3 h-3 text-slate-500" />
                            <select
                              value={file.folderId || ''}
                              onChange={(e) => onMoveFileToFolder(file.id, e.target.value || undefined)}
                              className="bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                            >
                              <option value="">(No folder)</option>
                              {folders.map((fld) => (
                                <option key={fld.id} value={fld.id}>
                                  📁 {fld.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1">
                            {ACCENT_COLORS.slice(0, 5).map((c) => (
                              <button
                                key={c}
                                onClick={() => onUpdateFileColor(file.id, c)}
                                className="w-3 h-3 rounded-full transition-transform hover:scale-125"
                                style={{
                                  backgroundColor: c,
                                  border: file.color === c ? '1.5px solid #ffffff' : 'none',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 flex items-center justify-between">
          <span>
            {files.length} custom file{files.length === 1 ? '' : 's'} · {folders.length} folder
            {folders.length === 1 ? '' : 's'} · Click a folder wedge in the radial menu to open its suboptions
          </span>
          <span className="text-[11px] text-sky-400">Right-click anywhere to summon at your cursor</span>
        </div>
      </div>
    </div>
  );
};
