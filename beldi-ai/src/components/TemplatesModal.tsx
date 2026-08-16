import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Layout, Gamepad2, BarChart3, Kanban, Terminal, FileText } from 'lucide-react';
import { STARTER_BLUEPRINTS } from '../data/blueprints';
import { StarterBlueprint } from '../types';

interface TemplatesModalProps {
  onClose: () => void;
  onSelectBlueprint: (blueprint: StarterBlueprint) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  onClose,
  onSelectBlueprint
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Websites', 'Games', 'Dashboards', 'Apps', 'Tools'];

  const filtered = selectedCategory === 'All' 
    ? STARTER_BLUEPRINTS 
    : STARTER_BLUEPRINTS.filter(b => b.category === selectedCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layout': return <Layout className="w-5 h-5" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5" />;
      case 'BarChart3': return <BarChart3 className="w-5 h-5" />;
      case 'Kanban': return <Kanban className="w-5 h-5" />;
      case 'Terminal': return <Terminal className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0C0C0E] border border-[#1C1C1E] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#1C1C1E] flex items-center justify-between bg-[#09090B]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold mb-2 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Beldi AI Blueprint Library
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Starter Web Apps & Blueprints</h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">Select a blueprint to instantly build and preview live with Beldi AI.</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#71717A] hover:text-white hover:bg-[#1C1C1E] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category filter pills */}
        <div className="px-6 sm:px-8 py-3 bg-[#09090B] border-b border-[#1C1C1E] flex items-center gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#18181B] text-[#71717A] hover:text-white border border-[#1C1C1E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blueprint Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(blueprint => (
            <div
              key={blueprint.id}
              className="p-5 rounded-2xl bg-[#09090B] border border-[#1C1C1E] hover:border-indigo-500/50 hover:bg-[#121214] transition-all flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${blueprint.accentColor} text-white shadow-md`}>
                    {getIcon(blueprint.iconName)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#18181B] text-indigo-400 border border-[#1C1C1E]">
                    {blueprint.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {blueprint.title}
                </h3>
                <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
                  {blueprint.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1C1C1E] flex items-center justify-between">
                <span className="text-[11px] text-[#71717A] font-mono">Live Sandbox Ready</span>
                <button
                  onClick={() => {
                    onSelectBlueprint(blueprint);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                >
                  <span>Build This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
