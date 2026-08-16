import React, { useState } from 'react';
import { 
  Copy, Check, Sparkles, ExternalLink, Code2, 
  ThumbsUp, ThumbsDown, RotateCw, MonitorPlay, Terminal,
  FileText, Image as ImageIcon, Crown, Shield, Download, Archive, Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, LiveArtifact, FileAttachment, User } from '../types';
import { Logo } from './Logo';
import { ThinkingIndicator } from './ThinkingIndicator';
import { exportProjectZip } from '../utils/zipExport';

interface ChatMessageItemProps {
  message: ChatMessage;
  userPrompt?: string;
  onOpenArtifact: (artifact: LiveArtifact) => void;
  activeArtifactId?: string;
  currentUser?: User | null;
  onOpenPricing?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  userPrompt = '',
  onOpenArtifact,
  activeArtifactId,
  currentUser,
  onOpenPricing
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);

  const isUser = message.sender === 'user';
  const isPremiumOrOwner = currentUser?.role === 'premium' || 
                           currentUser?.role === 'owner' || 
                           currentUser?.role === 'developer';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZipDownload = async (artifact: LiveArtifact) => {
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

  return (
    <div className={`w-full py-4 sm:py-6 ${isUser ? 'bg-transparent' : 'bg-[#171717]/40 border-y border-[#1F1F1F]/40'}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-md">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#212121] border border-[#2F2F2F] flex items-center justify-center shadow-sm">
              <Logo size="sm" showText={false} />
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header Name & Badges */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">
              {isUser ? 'You' : 'Beldi AI'}
            </span>
            {!isUser && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Ultra
              </span>
            )}
            <span className="text-[10px] text-[#71717A] font-mono">
              {message.timestamp}
            </span>
          </div>

          {/* User Attachments Render */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {message.attachments.map((att: FileAttachment) => (
                <div key={att.id} className="relative group">
                  {att.previewUrl || att.dataUrl?.startsWith('data:image') ? (
                    <div 
                      onClick={() => setSelectedImage(att.previewUrl || att.dataUrl)}
                      className="cursor-pointer rounded-xl overflow-hidden border border-[#383838] bg-black/40 hover:border-indigo-500 transition-all shadow-md max-w-xs"
                    >
                      <img
                        src={att.previewUrl || att.dataUrl}
                        alt={att.name}
                        className="max-h-48 object-cover rounded-xl"
                      />
                      <div className="p-1.5 bg-[#1C1C1E]/90 text-[10px] text-neutral-300 font-mono truncate max-w-[200px]">
                        {att.name}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#212124] border border-[#383838] text-xs text-white">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="font-medium text-[11px] truncate max-w-[160px]">{att.name}</p>
                        <p className="text-[9px] text-[#8E8E93]">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Assistant Thinking / Cooking Animation (ChatGPT 3-Balls Indicator) */}
          {!isUser && message.isStreaming && !message.content && (
            <ThinkingIndicator userPrompt={userPrompt} />
          )}

          {/* Text Content */}
          {message.content ? (
            <div className="text-[14px] sm:text-[15px] leading-relaxed text-[#ECECEC] font-sans break-words space-y-3">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1E1E1E] prose-pre:border prose-pre:border-[#2F2F2F] prose-pre:rounded-2xl prose-code:font-mono prose-code:text-indigo-300">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeText = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                          return (
                            <div className="my-3 rounded-2xl overflow-hidden border border-[#2F2F2F] bg-[#1E1E1E]">
                              <div className="px-4 py-2 bg-[#262626] border-b border-[#2F2F2F] flex items-center justify-between text-xs text-[#A1A1AA]">
                                <span className="font-mono font-medium text-[11px] uppercase tracking-wider text-indigo-400">
                                  {match[1]}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(codeText);
                                  }}
                                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Copy code</span>
                                </button>
                              </div>
                              <pre className="p-4 overflow-x-auto text-[13px] font-mono text-[#E4E4E7] leading-normal">
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <code className="px-1.5 py-0.5 rounded-md bg-[#2A2A2A] text-indigo-300 text-[13px] font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {/* Active Streaming 3-balls indicator */}
                  {message.isStreaming && (
                    <div className="flex items-center gap-1.5 pt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Interactive Live Artifact / Canvas Card with ZIP Export */}
          {message.artifact && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#1C1C24] to-[#18181B] border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <MonitorPlay className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {message.artifact.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      {message.artifact.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                    Live interactive single-file application ready for execution & test.
                  </p>
                  {zipMessage && (
                    <p className="text-[10px] text-amber-400 font-mono mt-1">
                      {zipMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Download ZIP Button (Gated for Premium/Owner) */}
                <button
                  onClick={() => handleZipDownload(message.artifact!)}
                  disabled={isExportingZip}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                    isPremiumOrOwner 
                      ? 'bg-[#212124] hover:bg-[#2A2A2E] text-amber-300 border border-amber-500/30' 
                      : 'bg-[#1C1C1F] hover:bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                  title={isPremiumOrOwner ? 'Download complete project ZIP bundle' : 'ZIP Bundle Download is a Premium Feature'}
                >
                  {isPremiumOrOwner ? (
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                  )}
                  <span>{isExportingZip ? 'Packaging...' : 'Download ZIP'}</span>
                  {!isPremiumOrOwner && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">PRO</span>
                  )}
                </button>

                {/* Open Canvas */}
                <button
                  onClick={() => onOpenArtifact(message.artifact!)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Open Canvas</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Toolbar for Assistant */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="flex items-center gap-2 pt-2 text-[#71717A]">
              <button
                onClick={handleCopy}
                title="Copy response"
                className="p-1.5 hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
                title="Good response"
                className={`p-1.5 hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors cursor-pointer ${
                  feedback === 'liked' ? 'text-emerald-400' : ''
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
                title="Bad response"
                className={`p-1.5 hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors cursor-pointer ${
                  feedback === 'disliked' ? 'text-rose-400' : ''
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={selectedImage}
            alt="Full size attachment"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
