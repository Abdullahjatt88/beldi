import React, { useState } from 'react';
import { 
  Plus, MessageSquare, Trash2, Search, Sparkles, 
  Settings, Layers, ChevronRight, User, LogIn, LogOut,
  SquarePen, PanelLeftClose, PanelLeft, Crown, Zap, Bug,
  ExternalLink, MessageSquareText, GitBranch, ShieldCheck
} from 'lucide-react';
import { ChatSession, User as UserType } from '../types';
import { Logo } from './Logo';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  onOpenPricing: () => void;
  onOpenBugReport: () => void;
  aiOnline: boolean;
  isOpen: boolean;
  onCloseMobile: () => void;
  onToggleSidebar: () => void;
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenSettings,
  onOpenAdmin,
  onOpenPricing,
  onOpenBugReport,
  aiOnline,
  isOpen,
  onCloseMobile,
  onToggleSidebar,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isOwner = currentUser?.role === 'owner';
  const isPremium = currentUser?.role === 'premium';
  const isFree = !isOwner && !isPremium;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ChatGPT Sidebar Panel */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#171717] border-r border-[#262626] flex flex-col transition-all duration-300 select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden lg:border-none'
      }`}>
        {/* Header Branding & New Chat icon */}
        <div className="h-14 px-3 border-b border-[#262626] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onNewSession();
                onCloseMobile();
              }}
              title="New chat"
              className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#212121] rounded-lg transition-colors"
            >
              <SquarePen className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleSidebar}
              title="Close sidebar"
              className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#212121] rounded-lg transition-colors hidden lg:flex"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Primary Button */}
        <div className="p-3 shrink-0 space-y-2">
          <button
            onClick={() => {
              onNewSession();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3 bg-[#212121] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-white font-medium rounded-xl text-xs flex items-center justify-between transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>New chat</span>
            </div>
            <SquarePen className="w-3.5 h-3.5 text-[#71717A]" />
          </button>

          {/* Quick Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-[#212121] border border-[#2F2F2F] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-indigo-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
          <div className="px-3 py-1.5 text-[11px] font-medium text-[#71717A]">
            Recent Chats ({filteredSessions.length})
          </div>

          {filteredSessions.length === 0 ? (
            <div className="py-8 text-center px-4 space-y-2">
              <MessageSquare className="w-5 h-5 text-[#71717A] mx-auto opacity-30" />
              <p className="text-xs text-[#71717A]">No conversations yet</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const hasArtifact = !!session.activeArtifact || session.messages.some(m => !!m.artifact);

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#212121] text-white font-medium shadow-sm'
                      : 'text-[#C5C5D2] hover:text-white hover:bg-[#212121]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {hasArtifact ? (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                    )}
                    <span className="text-xs truncate">{session.title}</span>
                  </div>

                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    title="Delete chat"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#71717A] hover:text-rose-400 rounded transition-all ml-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Upgrade Plan Banner */}
        <div className="p-3 border-t border-[#262626] space-y-1.5 bg-[#171717]">
          {isFree ? (
            <button
              onClick={onOpenPricing}
              className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-[#212124] border border-indigo-500/30 hover:border-indigo-500/60 text-left flex items-center justify-between text-xs text-white transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold text-[11px] leading-tight">Upgrade Plan</p>
                  <p className="text-[9px] text-[#8E8E93]">Unlimited uploads & AI speed</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
            </button>
          ) : (
            <div className="py-1.5 px-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-[11px]">PREMIUM ACTIVE</span>
              </div>
              <span className="text-[9px] text-indigo-400 font-mono">Unlimited</span>
            </div>
          )}

          {/* Bug Report Button */}
          <button
            onClick={onOpenBugReport}
            className="w-full py-1.5 px-2 text-[#8E8E93] hover:text-white hover:bg-[#212121] rounded-lg transition-colors flex items-center justify-between text-[11px]"
          >
            <div className="flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>Report a Bug (@build_x_official)</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#71717A]" />
          </button>
        </div>

        {/* User Account / Auth Bar */}
        <div className="p-3 border-t border-[#262626] bg-[#141416]">
          {currentUser ? (
            <div className="p-2 rounded-xl bg-[#212121] border border-[#2F2F2F] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-full ${
                  isOwner ? 'bg-rose-600' : (isPremium ? 'bg-indigo-600' : 'bg-neutral-700')
                } flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                  {isOwner ? '👑' : currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-white truncate">{currentUser.name}</p>
                  </div>
                  <p className="text-[10px] text-[#71717A] truncate font-sans">
                    {isOwner ? '👑 Owner' : isPremium ? '⭐ Premium' : `Free (${currentUser.uploadsCount || 0}/10 uploads)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenSettings}
                  title="Settings & Storage"
                  className="p-1 text-[#71717A] hover:text-white rounded transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-1 text-[#71717A] hover:text-rose-400 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 px-3 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in or Sign up</span>
            </button>
          )}

          {/* Model Status */}
          <div className="pt-2.5 px-1 flex items-center justify-between text-[11px] text-[#71717A]">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${aiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>Beldi AI Ultra</span>
            </div>
            <a 
              href="https://instagram.com/build_x_official" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] text-indigo-400 hover:underline"
            >
              @build_x_official
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
