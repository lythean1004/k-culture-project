'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PackageItem, RecommendedPackage } from '@/lib/recommend/types';
import BilingualName from '../i18n/BilingualName';
import TranslationBadge from '../i18n/TranslationBadge';
import SwapModal from './SwapModal';
import { ofetch } from 'ofetch';

interface PackageTimelineProps {
  pkg: RecommendedPackage;
  sessionId?: string;
  onUpdateItems: (newItems: PackageItem[]) => void;
  onHoverItem?: (idx: number | null) => void;
}

export default function PackageTimeline({ pkg, sessionId, onUpdateItems, onHoverItem }: PackageTimelineProps) {
  const t = useTranslations('package');
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  // Time slot labels mapping
  const timeSlots: Record<string, string> = {
    MORNING: '09:00 - 11:30',
    LUNCH: '12:00 - 13:30',
    AFTERNOON: '14:00 - 17:30',
    EVENING: '18:00 - 20:30',
    NIGHT: '21:00 - 22:30',
  };

  const handleOutlinkClick = async (itemId: string) => {
    try {
      await ofetch('/api/recommend/log', {
        method: 'POST',
        body: {
          sessionId,
          packageId: pkg.packageId,
          action: 'click_outlink',
        },
      });
      console.log(`Outlink clicked logged for item: ${itemId}`);
    } catch (e) {
      console.error('Failed to log outlink click:', e);
    }
  };

  const handleSwapSelect = async (newItem: PackageItem) => {
    if (swapIndex === null) return;
    
    const newItems = [...pkg.items];
    // Keep slot type and basic seq structure, replace content
    newItems[swapIndex] = {
      ...newItems[swapIndex],
      refId: newItem.refId,
      name: newItem.name,
      nameKo: newItem.nameKo || newItem.name,
      nameI18n: newItem.nameI18n,
      lat: newItem.lat,
      lng: newItem.lng,
      primaryType: newItem.primaryType,
    };

    onUpdateItems(newItems);

    // Log swap action to database
    try {
      await ofetch('/api/recommend/log', {
        method: 'POST',
        body: {
          sessionId,
          packageId: pkg.packageId,
          action: 'swap',
        },
      });
    } catch (e) {
      console.error('Failed to log swap event:', e);
    }
  };

  return (
    <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8 py-2">
      {pkg.items.map((item, idx) => {
        const slotText = timeSlots[item.slotType] || item.slotType;
        const displayName = item.name;
        const nameKo = item.nameKo || item.name;

        return (
          <div
            key={item.id}
            onMouseEnter={() => onHoverItem && onHoverItem(idx)}
            onMouseLeave={() => onHoverItem && onHoverItem(null)}
            className="relative group transition-all duration-300"
          >
            {/* Timeline dot marker */}
            <span className="absolute -left-[35px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-purple-500 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            </span>

            {/* Stop box */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4 hover:border-purple-500/40 transition duration-300">
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-purple-400 tracking-wider">
                  🕒 {slotText} (Stop {idx + 1})
                </span>
                <div className="flex items-center gap-2">
                  <TranslationBadge grade="A" source="OFFICIAL_HUMAN" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                    {item.itemType}
                  </span>
                </div>
              </div>

              {/* Title & Bilingual Name */}
              <BilingualName nameKo={nameKo} nameTranslated={displayName} />

              {/* Descriptions stub */}
              <p className="text-sm text-slate-400 leading-relaxed">
                Enjoy cultural assets, exhibitions, and landscapes curated dynamically according to your preferences. Check official links for booking information and visitor guides.
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-950">
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>🕒 Open: 09:00 - 18:00 (Closed on Mondays)</p>
                  <p>🛣️ Travel to next stop: ~15 mins public transit</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapIndex(idx)}
                    className="px-3 py-1.5 border border-slate-700 bg-slate-950/80 hover:bg-slate-800 hover:border-slate-600 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    🔄 {t('swapButton')}
                  </button>
                  <a
                    href="https://english.visitkorea.or.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOutlinkClick(item.id)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-purple-500/10"
                  >
                    {t('officialSite')} ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Swap Modal Container */}
      <SwapModal
        packageId={pkg.packageId}
        cityCode={pkg.cityName?.toLowerCase()}
        itemIndex={swapIndex !== null ? swapIndex : 0}
        isOpen={swapIndex !== null}
        onClose={() => setSwapIndex(null)}
        onSelectSwap={handleSwapSelect}
      />
    </div>
  );
}
