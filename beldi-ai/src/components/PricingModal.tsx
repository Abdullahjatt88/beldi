import React from 'react';
import { 
  X, Check, Sparkles, Zap, MessageSquareText,
  ExternalLink, AlertCircle, Code2, Globe, FileCode2
} from 'lucide-react';
import { User } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  if (!isOpen) return null;

  const currentRole = currentUser?.role || 'free';
  const isPremium = currentRole === 'premium' || currentRole === 'owner' || currentRole === 'developer';
  const isFree = !isPremium;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#1C1C1E] border border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#2F2F2F] bg-[#141416] flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Beldi AI Plans
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Upgrade Your Experience
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Simple, powerful AI for everyday conversations, study, writing, and beast-mode coding.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8E8E93] hover:text-white hover:bg-[#2F2F2F] rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Cards Grid - Clean 2 Column */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#171719]">
          
          {/* 1. FREE PLAN */}
          <div className={`p-6 rounded-2xl bg-[#212124] border ${isFree ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-[#2F2F2F]'} flex flex-col justify-between space-y-6 shadow-sm`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93]">Free Plan</span>
                {isFree && (
                  <span className="text-[10px] font-bold bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-700">
                    CURRENT PLAN
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black text-white">$0</div>
                <p className="text-xs text-[#8E8E93]">Free for all general chats & apps</p>
              </div>

              <ul className="space-y-3 text-xs text-[#C5C5D2] pt-2">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All-Purpose AI for chat, writing, homework & ideas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive Live Website & Game Canvas Builder</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>10 Total</strong> Photo & File Uploads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Local SQLite Persistent Chat History</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#2F2F2F]">
              <div className="text-center text-xs text-[#71717A] py-2 font-medium">
                {currentUser ? `Uploads Used: ${currentUser.uploadsCount || 0}/10` : 'Default on sign up'}
              </div>
            </div>
          </div>

          {/* 2. PREMIUM PRO PLAN */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 via-[#212124] to-[#212124] border-2 border-indigo-500/60 flex flex-col justify-between space-y-6 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg tracking-wider">
              MOST POPULAR
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Premium Pro</span>
                </div>
                {isPremium && (
                  <span className="text-[10px] font-bold bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black text-white">DM to Upgrade</div>
                <p className="text-xs text-indigo-300">Instant VIP activation</p>
              </div>

              <ul className="space-y-3 text-xs text-white pt-2">
                <li className="flex items-center gap-2.5 font-semibold text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Unlimited</strong> File & Photo Uploads</span>
                </li>
                <li className="flex items-center gap-2.5 font-semibold text-amber-300">
                  <FileCode2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Full Project ZIP Archive Export</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Beast-Mode Code Engine & Complex App Architecture</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ultra-High Priority Generation Speed</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Extended Memory & Reasoning Context</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pro Badge on Account Profile</span>
                </li>
              </ul>
            </div>

            {/* DM CTA */}
            <div className="pt-4 border-t border-indigo-500/30 space-y-2">
              <a
                href="https://instagram.com/build_x_official"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>DM us on Instagram @build_x_official</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[10px] text-center text-[#8E8E93]">
                Instant activation upon DM confirmation
              </p>
            </div>
          </div>

        </div>

        {/* Footer Support Info */}
        <div className="px-6 sm:px-8 py-4 border-t border-[#2F2F2F] bg-[#141416] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8E8E93]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Need help or custom features? DM us on Instagram: <strong>@build_x_official</strong></span>
          </div>

          <a
            href="https://instagram.com/build_x_official"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>@build_x_official</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
