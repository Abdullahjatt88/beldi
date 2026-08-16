import React, { useState } from 'react';
import { 
  X, Bug, MessageSquareText, ExternalLink, 
  Copy, CheckCheck, ShieldAlert, Sparkles, Send
} from 'lucide-react';
import { User } from '../types';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [copied, setCopied] = useState(false);
  const [bugDescription, setBugDescription] = useState('');

  if (!isOpen) return null;

  const diagnostics = `[Beldi AI Bug Report]
User Email: ${currentUser?.email || 'Guest'}
User Role: ${currentUser?.role || 'free'}
Platform: ${navigator.userAgent}
Screen: ${window.innerWidth}x${window.innerHeight}
Time: ${new Date().toISOString()}
Description: ${bugDescription || 'No description provided'}`;

  const copyDiagnostics = () => {
    navigator.clipboard.writeText(diagnostics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#212121] border border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2F2F2F] bg-[#171717] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Report a Bug / Get Support</h2>
              <p className="text-xs text-[#8E8E93]">Official Instagram Support Team</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2F2F2F] space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <MessageSquareText className="w-4 h-4" />
              <span>Direct Support on Instagram</span>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              If you found a bug, experience an error, or need technical assistance, message our official Instagram account <strong>@build_x_official</strong>. Our team will review and resolve it promptly.
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Describe the issue (optional):</label>
            <textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="What happened? (e.g., website generation stuck, error code received, feature request)..."
              rows={3}
              className="w-full bg-[#171717] border border-[#2F2F2F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          </div>

          {/* Diagnostics Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E8E93]">System Diagnostics & Report Info:</span>
              <button
                onClick={copyDiagnostics}
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px]"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Info'}</span>
              </button>
            </div>
            <pre className="p-3 bg-black/60 border border-[#2F2F2F] rounded-xl text-[10px] text-neutral-300 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto">
              {diagnostics}
            </pre>
          </div>

          {/* Direct Link to Instagram */}
          <a
            href="https://instagram.com/build_x_official"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Open Instagram @build_x_official to Report</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
