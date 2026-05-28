'use client';

import { useState } from 'react';

interface TranslationBadgeProps {
  grade?: 'A' | 'B' | 'B_MINUS' | 'C' | string;
  source?: string;
}

export default function TranslationBadge({ grade = 'C', source }: TranslationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Grade color scheme
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    B: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    B_MINUS: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    C: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  };

  const scheme = colors[grade] || colors.C;

  // Source descriptions
  const getSourceDesc = (src?: string) => {
    switch (src) {
      case 'OFFICIAL_HUMAN':
        return 'Official Human Translation';
      case 'OFFICIAL_SITE_LAYER':
        return 'Official Site Provided Translation';
      case 'MT_GLOSSARY':
        return 'Machine Translation (Glossary Tuned)';
      case 'MT_GLOSSARY_AI_POSTEDIT':
        return 'AI-Postedited Machine Translation';
      case 'LLM_GENERATED':
        return 'AI Generated Translation';
      case 'LLM_LOCAL_QWEN_GENERATED':
        return 'Local LLM Generated Translation';
      case 'MANUAL_EDITOR':
        return 'Manually Curated / Edited';
      default:
        return 'Standard Public Database Text';
    }
  };

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`cursor-pointer inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${scheme.bg} ${scheme.text} ${scheme.border} transition-all hover:scale-105 duration-200`}
      >
        Transl. {grade}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md shadow-xl z-50 pointer-events-none transition-all duration-200 opacity-100 scale-100">
          <p className="font-semibold text-purple-400 mb-0.5">Translation Quality: {grade}</p>
          <p className="text-slate-400 leading-tight">
            Source: {getSourceDesc(source)}
          </p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
}
