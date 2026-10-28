import React, { useState, useEffect } from 'react';
import { UserFile } from '../../types/radial';
import { X, Copy, Download, Check, Save, FileText, Code, Table, Eye, Pin, PinOff } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface FileViewerModalProps {
  file: UserFile | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveFile: (updatedFile: UserFile) => void;
  onTogglePin: (fileId: string) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  isOpen,
  onClose,
  onSaveFile,
  onTogglePin,
}) => {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [csvFilter, setCsvFilter] = useState('');

  useEffect(() => {
    if (file) {
      setContent(file.content);
      // Auto open preview for CSV or Markdown
      if (file.name.endsWith('.csv') || file.type.includes('image')) {
        setActiveTab('preview');
      } else {
        setActiveTab('editor');
      }
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image/') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.svg');
  const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';
  const isMarkdown = file.name.endsWith('.md') || file.type === 'text/markdown';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    soundManager.playActionChime(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveFile({
      ...file,
      content,
      size: new Blob([content]).size,
      lastModified: Date.now(),
    });
    setSaved(true);
    soundManager.playActionChime(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: file.type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playActionChime(true);
  };

  // CSV table parsing
  const renderCsvTable = () => {
    const rows = content.trim().split('\n').map((row) => row.split(','));
    if (rows.length === 0) return <div className="text-slate-400 p-4">Empty CSV file</div>;
    const headers = rows[0];
    const dataRows = rows.slice(1).filter((r) =>
      r.some((cell) => cell.toLowerCase().includes(csvFilter.toLowerCase()))
    );

    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60">
          <input
            type="text"
            placeholder="Search in CSV data..."
            value={csvFilter}
            onChange={(e) => setCsvFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 w-64"
          />
          <span className="text-xs text-slate-400">
            {dataRows.length} of {rows.length - 1} rows
          </span>
        </div>
        <div className="overflow-auto flex-1 p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                {headers.map((h, idx) => (
                  <th key={idx} className="p-2.5 font-semibold text-slate-200 uppercase tracking-wider">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-slate-300 font-mono">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: file.color || '#38bdf8' }}
            >
              {isImage ? (
                <Eye className="w-4 h-4" />
              ) : isCsv ? (
                <Table className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">{file.name}</h3>
                {file.isPinnedToRadial && (
                  <span className="text-[10px] bg-sky-950 border border-sky-800 text-sky-400 px-1.5 py-0.5 rounded">
                    Pinned to Radial
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {(file.size / 1024).toFixed(1)} KB · Modified {new Date(file.lastModified).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View tabs for Markdown & CSV */}
            {(isMarkdown || isCsv) && (
              <div className="flex items-center p-1 bg-slate-800 rounded-lg mr-2">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'editor' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 inline mr-1" />
                  Source
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'preview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  Preview
                </button>
              </div>
            )}

            <button
              onClick={() => onTogglePin(file.id)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
                file.isPinnedToRadial
                  ? 'border-sky-700 bg-sky-950/60 text-sky-300 hover:bg-sky-900/60'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Pin directly into radial shortcut wheel"
            >
              {file.isPinnedToRadial ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              <span>{file.isPinnedToRadial ? 'Unpin Radial' : 'Pin to Radial'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
              title="Copy Content"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saved ? 'Saved!' : 'Save'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-950">
          {isImage ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              <img
                src={content}
                alt={file.name}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-2xl border border-slate-800"
              />
              <p className="mt-4 text-xs text-slate-400 font-mono">Image format: {file.type}</p>
            </div>
          ) : isCsv && activeTab === 'preview' ? (
            renderCsvTable()
          ) : isMarkdown && activeTab === 'preview' ? (
            <div className="h-full overflow-auto p-8 max-w-3xl mx-auto prose prose-invert text-slate-200">
              <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm bg-slate-900/60 p-6 rounded-xl border border-slate-800">
                {content}
              </pre>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-4 font-mono text-xs bg-slate-950 text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-0 select-text border-none"
                spellCheck={false}
                placeholder="File contents..."
              />
              <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                <span>
                  Lines: {content.split('\n').length} · Chars: {content.length}
                </span>
                <span>Press Save to commit changes</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
