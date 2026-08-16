import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Smartphone, Tablet, RotateCw, ExternalLink, 
  Code2, Eye, Terminal, Download, Maximize2, Minimize2, 
  Copy, Check, Sparkles, Send, X, Layers, Archive, Lock, AlertTriangle
} from 'lucide-react';
import { LiveArtifact, User } from '../types';
import { exportProjectZip } from '../utils/zipExport';

interface LivePreviewPanelProps {
  artifact: LiveArtifact | null;
  onClose: () => void;
  onModifyArtifact: (instruction: string) => void;
  isGenerating?: boolean;
  currentUser?: User | null;
  onOpenPricing?: () => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  artifact,
  onClose,
  onModifyArtifact,
  isGenerating = false,
  currentUser,
  onOpenPricing
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'console'>('preview');
  const [deviceSize, setDeviceSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [modifyInput, setModifyInput] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; timestamp: string }>>([]);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isPremiumOrOwner = currentUser?.role === 'premium' || 
                           currentUser?.role === 'owner' || 
                           currentUser?.role === 'developer';

  // Reset console logs when artifact changes
  useEffect(() => {
    setConsoleLogs([
      {
        type: 'info',
        message: `Build X sandboxed runtime loaded: "${artifact?.title || 'Applet'}"`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, [artifact?.id]);

  // Listen to postMessage from sandboxed iframe for console logs
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BUILD_X_CONSOLE_LOG') {
        setConsoleLogs(prev => [
          ...prev,
          {
            type: event.data.level || 'log',
            message: event.data.message || '',
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!artifact) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(artifact.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'build-x-app'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZipDownload = async () => {
    if (!isPremiumOrOwner) {
      if (onOpenPricing) onOpenPricing();
      return;
    }

    setIsExportingZip(true);
    setZipMessage(null);
    try {
      const res = await exportProjectZip({
        artifact,
        currentUser,
        onRequireUpgrade: onOpenPricing
      });
      if (!res.success && res.message) {
        setZipMessage(res.message);
        setTimeout(() => setZipMessage(null), 4000);
      }
    } catch (err: any) {
      setZipMessage('Failed to create ZIP package.');
      setTimeout(() => setZipMessage(null), 4000);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([artifact.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleModifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyInput.trim() || isGenerating) return;
    onModifyArtifact(`Update the current ${artifact.title}: ${modifyInput.trim()}`);
    setModifyInput('');
  };

  return (
    <div className={`flex flex-col bg-[#09090B] border-l border-[#1C1C1E] transition-all duration-200 z-30 ${
      isFullscreen ? 'fixed inset-0 z-50 bg-[#09090B]' : 'w-full lg:w-[50%] h-full'
    }`}>
      {/* Top Controls Bar */}
      <div className="h-14 px-4 bg-[#0C0C0E] border-b border-[#1C1C1E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs">{artifact.title}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                {artifact.type}
              </span>
            </div>
            <p className="text-[10px] text-[#71717A] font-mono truncate">Live Build X Sandbox</p>
          </div>
        </div>

        {/* View mode toggle (Preview / Code / Console) */}
        <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-xl border border-[#1C1C1E]">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button
            onClick={() => setViewMode('console')}
            className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'console' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logs</span>
          </button>
        </div>

        {/* Actions & Responsive controls */}
        <div className="flex items-center gap-1.5">
          {viewMode === 'preview' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#18181B] p-1 rounded-xl border border-[#1C1C1E] mr-1">
              <button
                onClick={() => setDeviceSize('desktop')}
                title="Desktop View (100%)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  deviceSize === 'desktop' ? 'bg-[#27272A] text-white' : 'text-[#71717A] hover:text-[#E4E4E7]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceSize('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  deviceSize === 'tablet' ? 'bg-[#27272A] text-white' : 'text-[#71717A] hover:text-[#E4E4E7]'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceSize('mobile')}
                title="Mobile View (375px)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  deviceSize === 'mobile' ? 'bg-[#27272A] text-white' : 'text-[#71717A] hover:text-[#E4E4E7]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Download ZIP Package Button (Premium Only) */}
          <button
            onClick={handleZipDownload}
            disabled={isExportingZip}
            title={isPremiumOrOwner ? 'Download complete multi-file project ZIP archive' : 'ZIP Bundle Download is a Premium Feature'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isPremiumOrOwner 
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40' 
                : 'bg-[#18181B] hover:bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            {isPremiumOrOwner ? (
              <Archive className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400/80" />
            )}
            <span className="hidden md:inline">{isExportingZip ? 'Packaging...' : 'ZIP'}</span>
            {!isPremiumOrOwner && (
              <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">PRO</span>
            )}
          </button>

          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Reload sandbox"
            className="p-2 text-[#71717A] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            title="Download .html source file"
            className="p-2 text-[#71717A] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenNewTab}
            title="Open in new tab"
            className="p-2 text-[#71717A] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 text-[#71717A] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            title="Close Preview Panel"
            className="p-2 text-[#71717A] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ZIP Alert / Rate limit feedback bar */}
      {zipMessage && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{zipMessage}</span>
          </div>
          <button onClick={() => setZipMessage(null)} className="text-amber-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex-1 bg-[#09090B] overflow-hidden relative flex flex-col items-center justify-center p-2 sm:p-4">
        {viewMode === 'preview' && (
          <div className={`h-full transition-all duration-300 rounded-2xl overflow-hidden border border-[#1C1C1E] bg-[#0C0C0E] shadow-2xl flex flex-col ${
            deviceSize === 'mobile' ? 'w-[375px]' : deviceSize === 'tablet' ? 'w-[768px]' : 'w-full'
          }`}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={artifact.code.includes('<!DOCTYPE') ? artifact.code : `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://cdn.tailwindcss.com"></script>
                  </head>
                  <body class="bg-black text-white min-h-screen">
                    ${artifact.code}
                  </body>
                </html>
              `}
              title={artifact.title}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        )}

        {viewMode === 'code' && (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-[#1C1C1E] bg-[#0C0C0E] flex flex-col">
            <div className="px-4 py-2.5 bg-[#141416] border-b border-[#1C1C1E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-mono text-[#A1A1AA]">{artifact.title.toLowerCase().replace(/\s+/g, '-')}.html</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZipDownload}
                  className="px-2.5 py-1 bg-[#212124] hover:bg-[#2A2A2E] text-amber-300 border border-amber-500/30 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Archive className="w-3 h-3 text-amber-400" />
                  <span>Download ZIP</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-[#E4E4E7] leading-relaxed bg-[#0C0C0E] select-text">
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}

        {viewMode === 'console' && (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-[#1C1C1E] bg-[#0C0C0E] flex flex-col font-mono text-xs">
            <div className="px-4 py-2.5 bg-[#141416] border-b border-[#1C1C1E] flex items-center justify-between">
              <span className="text-[#A1A1AA]">Sandbox Console Output</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-[11px] text-[#71717A] hover:text-white transition-colors cursor-pointer"
              >
                Clear logs
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto space-y-1.5 select-text">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#71717A] text-[10px] shrink-0">{log.timestamp}</span>
                  <span className={
                    log.type === 'error' ? 'text-rose-400' :
                    log.type === 'warn' ? 'text-amber-400' : 'text-emerald-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Quick Iterate / Modify Prompt Bar */}
      <form onSubmit={handleModifySubmit} className="p-3 bg-[#0C0C0E] border-t border-[#1C1C1E] flex items-center gap-2">
        <input
          type="text"
          value={modifyInput}
          onChange={(e) => setModifyInput(e.target.value)}
          placeholder="Ask Beldi AI to modify this website/game (e.g. 'Add a dark mode toggle', 'Add sound effects')..."
          disabled={isGenerating}
          className="flex-1 bg-[#18181B] border border-[#27272A] focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!modifyInput.trim() || isGenerating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Update</span>
        </button>
      </form>
    </div>
  );
};
