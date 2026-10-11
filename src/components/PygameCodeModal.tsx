import React, { useState } from 'react';
import { Check, Copy, Download, Terminal, X } from 'lucide-react';
import { PYGAME_PACMAN_PYTHON_CODE } from '../game/pygameSource';

interface PygameCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PygameCodeModal: React.FC<PygameCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYGAME_PACMAN_PYTHON_CODE.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([PYGAME_PACMAN_PYTHON_CODE.trim()], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pacman_pygame.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="pygame-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="pygame-modal-content"
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0f172a] border-2 border-yellow-400/70 rounded-xl shadow-2xl overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-yellow-400" />
            <h2 className="font-arcade text-xs sm:text-sm text-yellow-400 tracking-wider">
              PACMAN_PYGAME.PY
            </h2>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="px-5 py-2.5 bg-yellow-400/10 border-b border-yellow-400/20 text-xs text-yellow-200/90 flex flex-wrap items-center justify-between gap-2">
          <span>
            Run locally: <code className="bg-black/50 px-2 py-0.5 rounded font-mono text-white">pip install pygame</code> then <code className="bg-black/50 px-2 py-0.5 rounded font-mono text-white">python pacman.py</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-medium text-xs rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              id="download-code-btn"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .py
            </button>
          </div>
        </div>

        {/* Code view */}
        <div className="flex-1 overflow-auto p-4 bg-[#070b13] font-mono text-xs leading-relaxed text-emerald-400/90 selection:bg-yellow-500 selection:text-black">
          <pre>
            <code>{PYGAME_PACMAN_PYTHON_CODE.trim()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
