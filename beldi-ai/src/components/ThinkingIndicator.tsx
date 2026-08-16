import React, { useState, useEffect } from 'react';

interface ThinkingIndicatorProps {
  userPrompt?: string;
  isBuildingApp?: boolean;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  userPrompt = '',
  isBuildingApp = false
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Detect strictly if user prompt is asking to build/create a project (website, game, app, tool, script)
  const promptLower = userPrompt.toLowerCase().trim();
  
  const isWebsiteRequest = 
    promptLower.includes('website') || 
    promptLower.includes('landing') || 
    promptLower.includes('portfolio') || 
    promptLower.includes('clone') || 
    promptLower.includes('saas') ||
    promptLower.includes('webpage') ||
    promptLower.includes('dashboard');

  const isGameRequest = 
    promptLower.includes('game') || 
    promptLower.includes('arcade') || 
    promptLower.includes('play');

  const isCodeOrAppRequest = 
    isBuildingApp || 
    isWebsiteRequest || 
    isGameRequest || 
    promptLower.includes('build a') || 
    promptLower.includes('create a') || 
    promptLower.includes('make a') || 
    promptLower.includes('develop a') || 
    promptLower.includes('generate a') ||
    promptLower.includes('write code for') ||
    promptLower.includes('program a');

  const websiteSteps = [
    { text: 'Cooking your website...', icon: '🍳', sub: 'Designing modern UI architecture' },
    { text: 'Building responsive layout...', icon: '⚡', sub: 'Structuring HTML & semantic tags' },
    { text: 'Crafting Tailwind styling...', icon: '🎨', sub: 'Applying sleek colors, typography & dark theme' },
    { text: 'Assembling interactive components...', icon: '🧩', sub: 'Injecting JavaScript events & animations' },
    { text: 'Finalizing live preview sandbox...', icon: '🚀', sub: 'Preparing executable preview' }
  ];

  const gameSteps = [
    { text: 'Cooking game engine...', icon: '🎮', sub: 'Setting up HTML5 2D canvas' },
    { text: 'Building game loop & physics...', icon: '⚡', sub: 'Configuring controls & collision' },
    { text: 'Rendering neon sprites & effects...', icon: '✨', sub: 'Styling game board & particles' },
    { text: 'Finalizing playable arcade...', icon: '🕹️', sub: 'Ready to play in Live Canvas' }
  ];

  const genericBuildSteps = [
    { text: 'Cooking your project...', icon: '🍳', sub: 'Analyzing requirements & architecture' },
    { text: 'Building clean code structure...', icon: '⚡', sub: 'Drafting high-performance logic' },
    { text: 'Finalizing project output...', icon: '✨', sub: 'Polishing layout & execution' }
  ];

  const steps = isGameRequest ? gameSteps : isWebsiteRequest ? websiteSteps : genericBuildSteps;

  useEffect(() => {
    if (!isCodeOrAppRequest) return;
    const timer = setInterval(() => {
      setStepIndex(prev => (prev + 1) % steps.length);
    }, 2200);

    return () => clearInterval(timer);
  }, [steps.length, isCodeOrAppRequest]);

  const currentStep = steps[stepIndex] || steps[0];

  // 1. NORMAL CHAT: ONLY smooth 3 bouncing balls appear (ChatGPT style)
  if (!isCodeOrAppRequest) {
    return (
      <div className="py-2.5 flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1F] rounded-full border border-[#2D2D30] shadow-sm">
          <div 
            className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce"
            style={{ animationDuration: '0.85s', animationDelay: '0ms' }}
          />
          <div 
            className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce"
            style={{ animationDuration: '0.85s', animationDelay: '170ms' }}
          />
          <div 
            className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce"
            style={{ animationDuration: '0.85s', animationDelay: '340ms' }}
          />
        </div>
      </div>
    );
  }

  // 2. PROJECT / WEBSITE / CODE BUILDING: Show 3 balls + "Cooking / Building" text + progress bar
  return (
    <div className="py-2 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* ChatGPT-style 3 Bouncing Balls */}
        <div className="flex items-center gap-1.5 p-2 bg-[#1C1C1F] rounded-full border border-[#2D2D30] shadow-inner shrink-0">
          <div 
            className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce shadow-sm shadow-indigo-500/50"
            style={{ animationDuration: '0.9s', animationDelay: '0ms' }}
          />
          <div 
            className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce shadow-sm shadow-indigo-400/50"
            style={{ animationDuration: '0.9s', animationDelay: '180ms' }}
          />
          <div 
            className="w-2 h-2 rounded-full bg-purple-400 animate-bounce shadow-sm shadow-purple-500/50"
            style={{ animationDuration: '0.9s', animationDelay: '360ms' }}
          />
        </div>

        {/* Dynamic Cooking & Building Status Text Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-[#1C1C24] to-[#18181B] border border-indigo-500/30 text-xs shadow-md transition-all duration-300">
          <span className="text-sm">{currentStep.icon}</span>
          <span className="font-semibold text-indigo-200 tracking-tight animate-pulse">
            {currentStep.text}
          </span>
          <span className="text-[10px] text-[#71717A] hidden sm:inline font-mono">
            ({currentStep.sub})
          </span>
        </div>
      </div>

      {/* Progress Bar for Project Builds */}
      <div className="w-52 h-1 bg-[#222226] rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full animate-pulse transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
