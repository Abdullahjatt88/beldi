import React from 'react';
import { 
  Code2, Gamepad2, LayoutDashboard, Sparkles, 
  Globe, Terminal, Cpu, ArrowUpRight
} from 'lucide-react';
import { Logo } from './Logo';

interface HeroWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
  userName?: string;
}

export const HeroWelcome: React.FC<HeroWelcomeProps> = ({
  onSelectPrompt,
  userName
}) => {
  const suggestions = [
    {
      icon: Globe,
      title: 'Build a Modern SaaS Landing Page',
      desc: 'Dark theme, animated hero, pricing tiers & features',
      prompt: 'Build a modern dark-mode SaaS landing page for an AI productivity tool with hero section, feature cards, pricing tiers, FAQ accordion, and interactive newsletter signup.'
    },
    {
      icon: Gamepad2,
      title: 'Create a Playable Arcade Game',
      desc: 'Cyber Snake 2D canvas game with particle FX & score tracking',
      prompt: 'Create a playable Cyber Snake arcade game with custom glowing neon canvas graphics, speed difficulty levels, high score tracker, and sound effect toggles.'
    },
    {
      icon: LayoutDashboard,
      title: 'Build a Crypto Intelligence Hub',
      desc: 'Live interactive price charts, converter & portfolio tracker',
      prompt: 'Build a real-time cryptocurrency tracker dashboard with live price simulation charts, currency converter, portfolio allocation pie chart, and watchlist.'
    },
    {
      icon: Terminal,
      title: 'Help Me Reason, Code & Brainstorm',
      desc: 'Full-stack software architecture, debugging & general AI chat',
      prompt: 'Can you explain how a high-performance vector database works under the hood, and provide a TypeScript implementation of cosine similarity search?'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-12 select-none">
      {/* ChatGPT Centered Brand Icon */}
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="p-3 bg-[#212121] rounded-2xl border border-[#2F2F2F] shadow-xl">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          {userName ? `What's on your mind, ${userName}?` : 'What can I help with today?'}
        </h1>
        <p className="text-sm text-[#A1A1AA] max-w-md font-sans">
          Chat naturally, reason through complex tasks, or ask me to build live, interactive websites, games, and web apps.
        </p>
      </div>

      {/* 2x2 ChatGPT Suggestion Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group text-left p-4 rounded-2xl bg-[#212121]/80 hover:bg-[#2F2F2F] border border-[#2F2F2F] hover:border-[#424242] transition-all flex items-start justify-between gap-3 shadow-sm hover:shadow-md"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#71717A] opacity-0 group-hover:opacity-100 group-hover:text-white transition-all shrink-0 mt-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
