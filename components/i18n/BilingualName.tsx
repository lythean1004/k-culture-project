'use client';

import { useState } from 'react';

interface BilingualNameProps {
  nameKo: string;
  nameTranslated: string;
}

export default function BilingualName({ nameKo, nameTranslated }: BilingualNameProps) {
  const [showKorean, setShowKorean] = useState(true);

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
      <span className="text-base sm:text-lg font-bold text-slate-100">{nameTranslated}</span>
      
      {showKorean && nameKo && (
        <span className="text-xs text-slate-400 font-mono bg-slate-900/60 border border-slate-800 px-1.5 py-0.5 rounded">
          {nameKo}
        </span>
      )}

      {nameKo && (
        <button
          type="button"
          onClick={() => setShowKorean(!showKorean)}
          className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline select-none text-left"
        >
          {showKorean ? 'Hide Original' : 'Show Original (한글)'}
        </button>
      )}
    </div>
  );
}
