import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Shield, Check, 
  Sparkles, User, LogOut, Globe, Moon, 
  Crown, Zap, HardDrive, Trash2, Database,
  Copy, CheckCheck, ExternalLink, Bug, MessageSquareText,
  AlertTriangle, MessagesSquare, Key, Cpu, Eye, EyeOff,
  GitBranch, GitCommit, UploadCloud, RefreshCw
} from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  aiOnline: boolean;
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenPricing: () => void;
  onOpenAdmin?: () => void;
  onOpenBugReport: () => void;
  onClearAllConversations?: () => Promise<void> | void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  aiOnline,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenPricing,
  onOpenAdmin,
  onOpenBugReport,
  onClearAllConversations
}) => {
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedMessage, setCleanedMessage] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccessMessage, setClearSuccessMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // GitHub Auto-Push State
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [gitMessage, setGitMessage] = useState<string | null>(null);

  const isOwner = currentUser?.role === 'owner';
  const isPremium = currentUser?.role === 'premium';
  const isFree = !isOwner && !isPremium;

  useEffect(() => {
    fetchStorageStats();
    fetchGitStatus();
  }, []);

  const fetchGitStatus = () => {
    fetch('/api/github/status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.status) {
          setGitStatus(data.status);
        }
      })
      .catch(() => {});
  };

  const handleManualGitPush = async () => {
    setIsPushingGit(true);
    setGitMessage(null);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Manual push from Beldi AI settings (${new Date().toLocaleTimeString()})` })
      });
      const data = await res.json();
      if (data.success) {
        setGitMessage(data.message || 'Successfully pushed changes to GitHub!');
      } else {
        setGitMessage(data.message || 'Failed to push to GitHub');
      }
      fetchGitStatus();
    } catch (e: any) {
      setGitMessage(e.message || 'Push request failed');
    } finally {
      setIsPushingGit(false);
      setTimeout(() => setGitMessage(null), 5000);
    }
  };
  const fetchStorageStats = () => {
    fetch('/api/storage/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setStorageStats(data.stats);
        }
      })
      .catch(() => {});
  };

  const handleCleanStorage = async () => {
    setIsCleaning(true);
    setCleanedMessage(null);
    try {
      const res = await fetch('/api/storage/clean', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStorageStats(data.stats);
        setCleanedMessage('Storage optimized & pruned successfully!');
        setTimeout(() => setCleanedMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleClearConversations = async () => {
    setIsClearing(true);
    setClearSuccessMessage(null);
    try {
      if (onClearAllConversations) {
        await onClearAllConversations();
      } else {
        const headers: Record<string, string> = {};
        if (currentUser?.id) {
          headers['x-user-id'] = currentUser.id;
        }
        await fetch('/api/sessions', {
          method: 'DELETE',
          headers
        });
      }
      fetchStorageStats();
      setShowConfirmClear(false);
      setClearSuccessMessage('All conversations cleared successfully!');
      setTimeout(() => setClearSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Failed to clear conversations:', e);
    } finally {
      setIsClearing(false);
    }
  };

  const sqlQuery = `UPDATE users SET role = 'owner' WHERE email = '${currentUser?.email || 'your_email@domain.com'}';`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#212121] border border-[#2F2F2F] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2F2F2F] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2F2F2F] text-white rounded-xl border border-[#383838]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Settings & Storage</h2>
              <p className="text-xs text-[#8E8E93]">Account tiers, database storage & preferences</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          
          {/* User Profile / Rank Badge Card */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2F2F2F] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${
                  isOwner ? 'bg-rose-600' : isPremium ? 'bg-indigo-600' : 'bg-gradient-to-tr from-indigo-600 to-indigo-400'
                } flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {isOwner ? '👑' : (currentUser ? currentUser.name.charAt(0).toUpperCase() : 'G')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">
                      {currentUser ? currentUser.name : 'Guest User'}
                    </h3>
                    {isOwner ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> OWNER
                      </span>
                    ) : isPremium ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" /> PREMIUM
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                        FREE TIER
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    {currentUser ? currentUser.email : 'Sign in to persist your chats & apps.'}
                  </p>
                </div>
              </div>

              {currentUser ? (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium transition-colors"
                >
                  Log Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-semibold transition-all shadow-md"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Plan Quotas & Upgrade Trigger */}
            <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs">
              <div className="text-[#A1A1AA]">
                Upload Limit: <strong className="text-white">{isFree ? `${currentUser?.uploadsCount || 0}/10 used` : 'Unlimited'}</strong>
              </div>
              {isOwner && onOpenAdmin ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow"
                >
                  <Shield className="w-3 h-3" />
                  <span>Open Owner Admin Hub</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 text-xs cursor-pointer"
                >
                  <span>View Plans & Upgrades</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* GitHub Auto-Push & Repository Sync (Owner Only) */}
          {isOwner && (
            <div className="p-4 rounded-2xl bg-[#171717] border border-[#2F2F2F] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">GitHub Auto-Push & Code Sync</h4>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  gitStatus?.hasToken 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {gitStatus?.hasToken ? 'Auto-Push Active' : 'Token Required'}
                </span>
              </div>

              <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                Automatically stages, commits, and pushes your changes directly to your GitHub repository.
              </p>

              <div className="p-3 rounded-xl bg-[#212121] border border-[#2F2F2F] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Repository:</span>
                  <span className="text-white font-mono font-medium">{gitStatus?.repo || 'Abdullahjatt88/beldi-ai'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Target Branch:</span>
                  <span className="text-indigo-300 font-mono">{gitStatus?.branch || 'main'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Pending Changes:</span>
                  <span className="text-amber-400 font-mono font-bold">{gitStatus?.pendingChangesCount ?? 0} modified/new files</span>
                </div>
                {gitStatus?.lastPushedAt && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2A2A2A]">
                    <span className="text-[#8E8E93]">Last Pushed:</span>
                    <span className="text-emerald-400 text-[11px]">{new Date(gitStatus.lastPushedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {!gitStatus?.hasToken && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    GitHub Token required for push access
                  </p>
                  <p className="text-amber-300/80">
                    Please add <code className="px-1 py-0.5 bg-black/40 rounded font-mono text-white">GITHUB_TOKEN</code> to your environment variables. A GitHub Personal Access Token (classic or fine-grained with <strong>repo / contents:write</strong> permission) is required to authenticate.
                  </p>
                </div>
              )}

              {gitMessage && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  gitMessage.includes('Successfully') || gitMessage.includes('up to date')
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{gitMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleManualGitPush}
                  disabled={isPushingGit}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isPushingGit ? 'animate-bounce' : ''}`} />
                  <span>{isPushingGit ? 'Pushing to GitHub...' : 'Push to GitHub Now'}</span>
                </button>

                <button
                  onClick={fetchGitStatus}
                  title="Refresh Git Status"
                  className="p-2 bg-[#262626] hover:bg-[#333333] text-neutral-300 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          {/* SQLite Storage Management & Anti-Full Protection */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2F2F2F] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">Database & Storage Optimization</h4>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Optimized
              </span>
            </div>

            <p className="text-[11px] text-[#8E8E93] leading-relaxed">
              Beldi AI automatically compresses uploaded photos to save up to 90% disk space and prune orphan temp caches to keep your SQLite database lean and fast.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#212121] border border-[#2F2F2F]">
                <span className="text-[10px] text-[#71717A] block">Database Size</span>
                <span className="font-bold text-white font-mono">{storageStats?.dbSizeFormatted || '0.15 MB'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#212121] border border-[#2F2F2F]">
                <span className="text-[10px] text-[#71717A] block">Saved Sessions</span>
                <span className="font-bold text-white font-mono">{storageStats?.sessionCount ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#212121] border border-[#2F2F2F]">
                <span className="text-[10px] text-[#71717A] block">Stored Messages</span>
                <span className="font-bold text-white font-mono">{storageStats?.messageCount ?? 0}</span>
              </div>
            </div>

            {cleanedMessage && (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                <span>{cleanedMessage}</span>
              </div>
            )}

            <button
              onClick={handleCleanStorage}
              disabled={isCleaning}
              className="w-full py-2 bg-[#262626] hover:bg-[#2F2F2F] text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#383838] transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isCleaning ? 'Optimizing Database...' : 'Clean Storage Cache & Prune'}</span>
            </button>
          </div>

          {/* Chat History & Clear All Conversations */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2F2F2F] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-white">Conversation History</h4>
              </div>
              <span className="text-[10px] text-[#8E8E93] bg-[#212121] px-2 py-0.5 rounded-md border border-[#2F2F2F]">
                Local & Database
              </span>
            </div>

            <p className="text-[11px] text-[#8E8E93] leading-relaxed">
              Clear all saved chat threads, user messages, and interactive live apps from your local device and database storage.
            </p>

            {showConfirmClear ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Are you sure? All conversation history will be permanently deleted.</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleClearConversations}
                    disabled={isClearing}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isClearing ? 'Clearing All...' : 'Yes, Delete All Conversations'}</span>
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    disabled={isClearing}
                    className="px-3.5 py-2 bg-[#262626] hover:bg-[#333333] text-neutral-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {clearSuccessMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>{clearSuccessMessage}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/25 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear All Conversations</span>
                </button>
              </div>
            )}
          </div>

          {/* Owner Role Administration Guide (SQL Query) */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-rose-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                <Crown className="w-4 h-4" />
                <span>Owner Role SQL Assignment</span>
              </div>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                SQL Only
              </span>
            </div>
            
            <p className="text-[11px] text-[#8E8E93] leading-relaxed">
              Owner rank cannot be bought. To grant yourself or a developer Owner rank with uncensored access, run this SQL statement directly in SQLite:
            </p>

            <div className="p-2.5 rounded-xl bg-black/80 border border-[#2F2F2F] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#A1A1AA]">
                <span className="font-mono">SQLite Command:</span>
                <button
                  onClick={copySql}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedSql ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {sqlQuery}
              </pre>
            </div>
          </div>

          {/* Instagram Support & Bug Reporting */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2F2F2F] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instagram Support & Upgrades</p>
                <p className="text-[11px] text-[#8E8E93]">DM @build_x_official for Premium plans & bug reports</p>
              </div>
            </div>

            <a
              href="https://instagram.com/build_x_official"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all border border-[#383838]"
            >
              <span>@build_x_official</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2F2F2F] bg-[#171717] flex items-center justify-between">
          <span className="text-[11px] text-[#71717A]">Beldi AI Ultra • Built by Build X</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
