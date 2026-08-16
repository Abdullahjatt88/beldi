import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, PanelLeftClose, SquarePen, Sparkles, 
  Settings, Eye, EyeOff, LogIn, LogOut, ChevronDown, 
  Bot, Lock, CheckCircle, ShieldCheck, Crown, Zap, Bug,
  ExternalLink
} from 'lucide-react';
import { ChatSession, ChatMessage, LiveArtifact, User as UserType, FileAttachment } from './types';
import { Logo } from './components/Logo';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInputBar } from './components/ChatInputBar';
import { HeroWelcome } from './components/HeroWelcome';
import { LivePreviewPanel } from './components/LivePreviewPanel';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { BugReportModal } from './components/BugReportModal';
import { AdminModal } from './components/AdminModal';

export const App: React.FC = () => {
  // Current User State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('buildx_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const initialSession: ChatSession = {
      id: 'session_init_001',
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      activeArtifact: null
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>('session_init_001');

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showPreviewPanel, setShowPreviewPanel] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [showBugReportModal, setShowBugReportModal] = useState<boolean>(false);
  const [authModalTitle, setAuthModalTitle] = useState<string>('Sign in to Beldi AI');
  const [authModalDesc, setAuthModalDesc] = useState<string>('You must be signed in or signed up to chat with Beldi AI by Build X.');
  const [aiOnline, setAiOnline] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Clear any legacy client-side keys so server configuration is always purely used
  useEffect(() => {
    localStorage.removeItem('beldi_custom_api_key');
    localStorage.removeItem('beldi_custom_model');
    localStorage.removeItem('beldi_custom_base_url');
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isOwner = currentUser?.role === 'owner';
  const isPremium = currentUser?.role === 'premium';
  const isFree = !isOwner && !isPremium;

  // Active session helper
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
    id: 'session_init_001',
    title: 'New chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    activeArtifact: null
  };

  // Refresh user data from server (to get latest uploadsCount and role)
  const refreshUserData = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('buildx_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to sync user data:', e);
    }
  };

  // Load sessions from SQLite API
  const loadSessionsFromDb = async () => {
    if (!currentUser) return;
    try {
      const headers: Record<string, string> = {
        'x-user-id': currentUser.id
      };
      const res = await fetch('/api/sessions', { headers });
      const data = await res.json();
      if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
        setSessions(data.sessions);
        if (!data.sessions.some((s: ChatSession) => s.id === activeSessionId)) {
          setActiveSessionId(data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sessions from SQLite backend:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadSessionsFromDb();
      refreshUserData();
    }
  }, [currentUser?.id]);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiOnline(!!data.aiOnline);
      })
      .catch(err => console.error('Health check error:', err));
  }, []);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isGenerating]);

  // If active session has an artifact, keep preview panel open
  useEffect(() => {
    if (activeSession?.activeArtifact) {
      setShowPreviewPanel(true);
    }
  }, [activeSessionId]);

  // Trigger Auth Modal with custom context
  const requireAuthPrompt = (title?: string, desc?: string) => {
    setAuthModalTitle(title || 'Sign in to Beldi AI');
    setAuthModalDesc(desc || 'You must be logged in or signed up to chat and build with Beldi AI by Build X.');
    setShowAuthModal(true);
  };

  // Handle Authentication Success
  const handleAuthSuccess = (user: UserType) => {
    setCurrentUser(user);
    localStorage.setItem('buildx_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('buildx_user');
    const fresh: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      activeArtifact: null
    };
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    setShowPreviewPanel(false);
  };

  // Create new session
  const handleNewSession = async () => {
    if (!currentUser) {
      requireAuthPrompt('Sign in to start a new chat');
      return;
    }

    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      activeArtifact: null
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowPreviewPanel(false);

    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      };

      await fetch('/api/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: newId, title: 'New chat' })
      });
    } catch (err) {
      console.error('Error creating session in SQLite:', err);
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting session in SQLite:', err);
    }

    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: `session_${Date.now()}`,
          title: 'New chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          activeArtifact: null
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Clear all conversations locally & in database
  const handleClearAllConversations = async () => {
    const fresh: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      activeArtifact: null
    };

    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    setShowPreviewPanel(false);

    try {
      const headers: Record<string, string> = {};
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      console.error('Error clearing sessions in database:', err);
    }
  };

  // Extract artifact from code text
  const extractCodeArtifact = (text: string): LiveArtifact | null => {
    const htmlMatch = text.match(/```html([\s\S]*?)```/i);
    if (htmlMatch && htmlMatch[1].trim().length > 50) {
      const code = htmlMatch[1].trim();
      let title = 'Interactive Application';
      let type: LiveArtifact['type'] = 'app';

      if (code.toLowerCase().includes('<canvas') || text.toLowerCase().includes('game')) {
        title = 'Playable Game';
        type = 'game';
      } else if (text.toLowerCase().includes('landing') || text.toLowerCase().includes('portfolio') || text.toLowerCase().includes('website')) {
        title = 'Live Website';
        type = 'website';
      } else if (text.toLowerCase().includes('dashboard') || text.toLowerCase().includes('chart')) {
        title = 'Interactive Dashboard';
        type = 'dashboard';
      }

      return {
        id: `art_${Date.now()}`,
        title,
        type,
        code,
        language: 'html',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return null;
  };

  // Send message to Beldi AI (Unified Chat & App Builder Engine)
  const handleSendMessage = async (text: string, attachments: FileAttachment[] = []) => {
    // STRICT AUTH GATE: User cannot use AI unless signed in
    if (!currentUser) {
      requireAuthPrompt('Sign in to use Beldi AI', 'Please sign in or create an account to chat with Beldi AI.');
      return;
    }

    if ((!text.trim() && attachments.length === 0) || isGenerating) return;

    // Check free plan upload quota client-side
    if (attachments.length > 0 && isFree) {
      const current = currentUser.uploadsCount || 0;
      if (current + attachments.length > 10) {
        setShowPricingModal(true);
        alert(`Free Plan limit reached! You have used ${current}/10 uploads. Upgrade to Premium by messaging @build_x_official on Instagram.`);
        return;
      }
    }

    // User message
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    // Assistant message placeholder for streaming
    const assistantMsgId = `msg_ast_${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      uncensoredMode: isOwner
    };

    // Generate smart session title from first message
    const isFirstMessage = activeSession.messages.length === 0;
    let newTitle = activeSession.title;
    if (isFirstMessage || activeSession.title === 'New chat') {
      newTitle = text.slice(0, 28) + (text.length > 28 ? '...' : '');
    }

    const updatedMessages = [...activeSession.messages, userMsg, assistantMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: newTitle,
          updatedAt: new Date().toISOString(),
          messages: updatedMessages
        };
      }
      return s;
    }));

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.slice(0, -1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          sessionId: activeSessionId,
          attachments
        })
      });

      if (response.status === 401) {
        requireAuthPrompt('Session Expired', 'Please log in again to continue.');
        throw new Error('Authentication required');
      }

      if (response.status === 403) {
        const errorData = await response.json();
        setShowPricingModal(true);
        throw new Error(errorData.error || 'Upload limit reached');
      }

      if (!response.body) throw new Error('No response body received.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';
      let detectedArtifact: LiveArtifact | null = null;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.slice(6).trim();
            if (!rawData || rawData === '[DONE]') continue;
            try {
              const data = JSON.parse(rawData);
              if (data.text) {
                streamedText += data.text;
                // Live update assistant message
                setSessions(prev => prev.map(s => {
                  if (s.id === activeSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m => 
                        m.id === assistantMsgId ? { ...m, content: streamedText } : m
                      )
                    };
                  }
                  return s;
                }));
              } else if (data.code && data.type) {
                // Direct artifact event
                detectedArtifact = {
                  id: data.id || `art_${Date.now()}`,
                  title: data.title || 'Live Application',
                  type: data.type,
                  code: data.code,
                  language: data.language || 'html',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
              }
            } catch (e) {
              console.error('SSE JSON parse error:', e);
            }
          }
        }
      }

      // Check for code artifact in streamed response
      if (!detectedArtifact) {
        detectedArtifact = extractCodeArtifact(streamedText);
      }

      // Finalize message
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const finalMessages = s.messages.map(m => 
            m.id === assistantMsgId ? { 
              ...m, 
              content: streamedText || 'Hello! How can I assist you with building, coding, or reasoning today?', 
              isStreaming: false,
              artifact: detectedArtifact || undefined
            } : m
          );
          return {
            ...s,
            messages: finalMessages,
            activeArtifact: detectedArtifact || s.activeArtifact
          };
        }
        return s;
      }));

      if (detectedArtifact) {
        setShowPreviewPanel(true);
      }

      // Sync user data to update upload counts
      refreshUserData();

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === assistantMsgId ? { 
                  ...m, 
                  content: err.message || 'I encountered a brief connection issue. Please try sending your message again.', 
                  isStreaming: false 
                } : m
              )
            };
          }
          return s;
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  // Modify current artifact
  const handleModifyArtifact = (instruction: string) => {
    handleSendMessage(instruction);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ECECEC] font-sans antialiased">
      {/* ChatGPT Left Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenPricing={() => setShowPricingModal(true)}
        onOpenBugReport={() => setShowBugReportModal(true)}
        aiOnline={aiOnline}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentUser={currentUser}
        onOpenAuth={() => requireAuthPrompt('Sign In / Sign Up')}
        onLogout={handleLogout}
      />

      {/* Main Conversation & Builder Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#212121]">
        {/* ChatGPT Minimal Top Navbar */}
        <header className="h-14 px-4 bg-[#212121] border-b border-[#2F2F2F]/60 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-[#8E8E93] hover:text-white hover:bg-[#2F2F2F] rounded-xl transition-colors"
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>

            {/* Model Badge */}
            <div 
              onClick={() => setShowPricingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#2F2F2F] cursor-pointer transition-colors text-white font-semibold text-sm select-none"
            >
              <span className="flex items-center gap-1.5">
                <span>Beldi AI</span>
                {isOwner ? (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> OWNER
                  </span>
                ) : isPremium ? (
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> PREMIUM
                  </span>
                ) : (
                  <span className="text-[10px] font-normal text-[#8E8E93] bg-[#2A2A2A] px-1.5 py-0.5 rounded-md border border-[#383838]">
                    by Build X
                  </span>
                )}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Instagram Official Support Button */}
            <a
              href="https://instagram.com/build_x_official"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2A2A2A] hover:bg-[#333333] text-[#ECECEC] border border-[#383838] transition-all"
              title="Official Instagram Support & Upgrades"
            >
              <span>@build_x_official</span>
              <ExternalLink className="w-3 h-3 text-indigo-400" />
            </a>

            {/* Owner Admin Menu Quick Button */}
            {isOwner && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-900 to-amber-900 hover:from-rose-800 hover:to-amber-800 text-white border border-rose-500/40 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Open Owner Admin Control Hub"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>Admin Hub</span>
              </button>
            )}

            {/* Upgrade Button */}
            {isFree && (
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade</span>
              </button>
            )}

            {/* Toggle Live Preview Canvas Button if artifact exists */}
            {activeSession.activeArtifact && (
              <button
                onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showPreviewPanel
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#2F2F2F] text-white hover:bg-[#383838]'
                }`}
              >
                {showPreviewPanel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPreviewPanel ? 'Hide Canvas' : 'View Canvas'}</span>
              </button>
            )}

            {/* User Auth controls / CTA */}
            {currentUser ? (
              <div 
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#2F2F2F] cursor-pointer transition-colors"
              >
                <div className={`w-6 h-6 rounded-full ${
                  isOwner ? 'bg-rose-600' : isPremium ? 'bg-indigo-600' : 'bg-gradient-to-tr from-indigo-600 to-indigo-400'
                } flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                  {isOwner ? '👑' : currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-white hidden md:inline">{currentUser.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => requireAuthPrompt('Log in to Beldi AI')}
                  className="px-3.5 py-1.5 bg-[#2F2F2F] hover:bg-[#3E3E3E] text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => requireAuthPrompt('Sign up for Beldi AI')}
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-semibold transition-all shadow-md"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Auth Gate Notification Banner if Logged Out */}
        {!currentUser && (
          <div className="bg-[#171717] border-b border-[#2F2F2F] px-4 py-2 flex items-center justify-between text-xs text-[#A1A1AA]">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Authentication required: Sign up or log in to unlock Beldi AI chatting and live website building.</span>
            </div>
            <button
              onClick={() => requireAuthPrompt('Sign in to Beldi AI')}
              className="text-white hover:underline font-semibold text-xs"
            >
              Sign In Now &rarr;
            </button>
          </div>
        )}

        {/* Split View: Single Unified Chat Feed + Canvas Preview */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Chat Stream Column */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeSession.messages.length === 0 ? (
                <HeroWelcome 
                  onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                  userName={currentUser?.name}
                />
              ) : (
                <div className="pb-6">
                  {activeSession.messages.map((message, idx) => {
                    const prevMsg = idx > 0 ? activeSession.messages[idx - 1] : null;
                    const userPrompt = prevMsg && prevMsg.sender === 'user' ? prevMsg.content : '';
                    return (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        userPrompt={userPrompt}
                        onOpenArtifact={(art) => {
                          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, activeArtifact: art } : s));
                          setShowPreviewPanel(true);
                        }}
                        activeArtifactId={activeSession.activeArtifact?.id}
                        currentUser={currentUser}
                        onOpenPricing={() => setShowPricingModal(true)}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom ChatGPT Pill Input */}
            <ChatInputBar
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onStopGeneration={handleStopGeneration}
              isAuthenticated={!!currentUser}
              onRequireAuth={() => requireAuthPrompt('Authentication Required', 'Please sign in or create an account to chat with Beldi AI by Build X.')}
              currentUser={currentUser}
              onOpenPricing={() => setShowPricingModal(true)}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          </div>

          {/* Right Live Preview Docked Canvas */}
          {showPreviewPanel && activeSession.activeArtifact && (
            <LivePreviewPanel
              artifact={activeSession.activeArtifact}
              onClose={() => setShowPreviewPanel(false)}
              onModifyArtifact={handleModifyArtifact}
              isGenerating={isGenerating}
              currentUser={currentUser}
              onOpenPricing={() => setShowPricingModal(true)}
            />
          )}
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        title={authModalTitle}
        description={authModalDesc}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          aiOnline={aiOnline}
          currentUser={currentUser}
          onOpenAuth={() => requireAuthPrompt('Sign In / Sign Up')}
          onLogout={handleLogout}
          onOpenPricing={() => {
            setShowSettingsModal(false);
            setShowPricingModal(true);
          }}
          onOpenAdmin={() => {
            setShowSettingsModal(false);
            setShowAdminModal(true);
          }}
          onOpenBugReport={() => {
            setShowSettingsModal(false);
            setShowBugReportModal(true);
          }}
          onClearAllConversations={handleClearAllConversations}
        />
      )}

      {/* Pricing & Plan Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentUser={currentUser}
      />

      {/* Bug Report & Instagram Modal */}
      <BugReportModal
        isOpen={showBugReportModal}
        onClose={() => setShowBugReportModal(false)}
        currentUser={currentUser}
      />

      {/* Owner Admin Management Modal */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        currentUser={currentUser}
        onUserUpdated={refreshUserData}
      />
    </div>
  );
};

export default App;
