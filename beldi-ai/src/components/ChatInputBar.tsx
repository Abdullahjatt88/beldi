import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, Square, Paperclip, Mic, MicOff, 
  Sparkles, Globe, Lock, X, Image as ImageIcon,
  FileText, Zap, Crown, Key
} from 'lucide-react';
import { FileAttachment, User } from '../types';
import { optimizeFileForStorage } from '../utils/imageOptimizer';

interface ChatInputBarProps {
  onSendMessage: (text: string, attachments?: FileAttachment[]) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  currentUser: User | null;
  onOpenPricing: () => void;
  onOpenSettings?: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  isAuthenticated,
  onRequireAuth,
  currentUser,
  onOpenPricing,
  onOpenSettings
}) => {
  const [input, setInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isOwner = currentUser?.role === 'owner';
  const isPremium = currentUser?.role === 'premium';
  const isFree = !isOwner && !isPremium;
  const currentUploads = currentUser?.uploadsCount || 0;
  const maxUploads = isFree ? 10 : Infinity;
  const remainingUploads = Math.max(0, 10 - currentUploads);

  // Auto-resize textarea like ChatGPT
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 200)}px`;
    }
  }, [input]);

  // Voice Speech-to-Text Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Voice input error:', err);
      }
    }
  };

  // Handle file & photo uploads with client-side compression to prevent storage filling up
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check Free tier limit
    if (isFree && (currentUploads + attachments.length + files.length > 10)) {
      onOpenPricing();
      alert(`Free Plan limit reached! You have used ${currentUploads}/10 uploads. Upgrade to Premium by messaging @build_x_official on Instagram for unlimited uploads.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsCompressing(true);
    try {
      const newAttachments: FileAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const optimized = await optimizeFileForStorage(files[i]);
        newAttachments.push(optimized);
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (err) {
      console.error('File optimization error:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (isGenerating) {
      onStopGeneration();
      return;
    }

    if (!input.trim() && attachments.length === 0) return;

    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.pdf,.txt,.js,.ts,.html,.css,.json,.py"
        className="hidden"
      />

      {/* Attachments Preview Tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex items-center gap-2 bg-[#262626] border border-[#383838] px-2.5 py-1.5 rounded-xl text-xs text-white shadow-md animate-in fade-in"
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-6 h-6 object-cover rounded-md"
                />
              ) : (
                <FileText className="w-4 h-4 text-indigo-400" />
              )}
              <span className="max-w-[120px] truncate text-[11px] font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="text-[#8E8E93] hover:text-rose-400 transition-colors ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ChatGPT Rounded-3xl Pill Input Container */}
      <div 
        onClick={() => {
          if (!isAuthenticated) {
            onRequireAuth();
          }
        }}
        className={`relative flex flex-col bg-[#212121] rounded-3xl border ${
          isGenerating ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : 'border-[#2F2F2F] hover:border-[#383838] focus-within:border-[#4E4E52]'
        } shadow-lg transition-all p-2.5 sm:p-3`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !isAuthenticated 
              ? "Ask anything, get help with writing, study, or build a website or game..." 
              : "Ask anything, get answers, brainstorm, or create websites & games..."
          }
          rows={1}
          disabled={!isAuthenticated && false}
          className="w-full bg-transparent text-[#ECECEC] placeholder-[#8E8E93] text-[14px] sm:text-[15px] focus:outline-none resize-none px-2 py-1 max-h-48 leading-relaxed font-sans"
        />

        {/* Bottom Toolbar & Action Buttons */}
        <div className="flex items-center justify-between pt-2 px-1 mt-1 border-t border-[#2F2F2F]/50">
          
          {/* Left tools: Paperclip Upload + Quota + Quick prompts */}
          <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
            {/* Paperclip File Upload */}
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) onRequireAuth();
                else fileInputRef.current?.click();
              }}
              disabled={isCompressing}
              title={
                isPremium 
                  ? "Attach files/images (Unlimited)" 
                  : `Attach files/images (Free: ${remainingUploads} remaining)`
              }
              className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors flex items-center gap-1 text-[11px]"
            >
              <Paperclip className="w-4 h-4" />
              {isFree ? (
                <span className="hidden sm:inline text-[10px] text-[#71717A] bg-[#2A2A2A] px-1.5 py-0.5 rounded border border-[#383838]">
                  {currentUploads}/10
                </span>
              ) : (
                <span className="hidden sm:inline text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Unlimited
                </span>
              )}
            </button>

            {/* Quick Template Shortcuts */}
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) onRequireAuth();
                else setInput(prev => `${prev ? prev + ' ' : ''}Build a modern live website for `);
              }}
              className="p-1.5 hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
              title="Build website prompt shortcut"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Website</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) onRequireAuth();
                else setInput(prev => `${prev ? prev + ' ' : ''}Create a playable arcade game with `);
              }}
              className="p-1.5 hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
              title="Create game prompt shortcut"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Game</span>
            </button>
          </div>

          {/* Right Controls: Voice + Send */}
          <div className="flex items-center gap-1.5">
            {/* Voice Input */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Voice input'}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-[#8E8E93] hover:text-white hover:bg-[#2F2F2F]'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit / Stop Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                title="Stop generation"
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-all shadow-md"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && attachments.length === 0 && isAuthenticated}
                title={isAuthenticated ? 'Send message' : 'Sign in to use AI'}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() || attachments.length > 0 || !isAuthenticated
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-md cursor-pointer'
                    : 'bg-[#2F2F2F] text-[#71717A] cursor-not-allowed'
                }`}
              >
                {!isAuthenticated ? (
                  <Lock className="w-3.5 h-3.5 text-black" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ChatGPT Disclaimer & Upgrade Hint */}
      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#71717A] font-sans">
        <span>Beldi AI can make mistakes. Verify code and generated apps.</span>
        {isFree && (
          <button
            onClick={onOpenPricing}
            className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline hidden sm:inline"
          >
            Upgrade to Premium &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
