'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { RecommendedPackage } from '@/lib/recommend/types';
import AiSourceBadge from './AiSourceBadge';
import TranslationBadge from '../i18n/TranslationBadge';

interface PackageCardProps {
  pkg: RecommendedPackage;
  locale: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function PackageCard({ pkg, locale, isSelected = false, onSelect }: PackageCardProps) {
  const t = useTranslations('package');

  // Map theme code to text labels
  const themeLabels: Record<string, string> = {
    HISTORY: '🏛️ History',
    TRADITIONAL_MUSIC: '🪕 Music',
    MODERN_ART: '🎨 Art',
    FAMILY: '🎡 Family',
    NIGHT: '🌃 Night',
    WELLNESS: '🌿 Wellness',
    FOOD: '🍜 Food',
    FESTIVAL: '🎉 Festival',
  };

  const themeLabel = themeLabels[pkg.themeCode] || pkg.themeCode;

  // Mini icons based on itemType
  const getItemIcon = (type: 'PLACE' | 'EVENT') => {
    return type === 'EVENT' ? '🎭' : '📍';
  };

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border p-5 space-y-4 transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500 shadow-xl shadow-purple-500/5'
          : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
      }`}
    >
      {/* Top badges row */}
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/20 bg-purple-500/10 text-purple-400 uppercase tracking-wider">
          {themeLabel}
        </span>
        <div className="flex items-center gap-2">
          <TranslationBadge grade="A" source="OFFICIAL_HUMAN" />
          <AiSourceBadge source={pkg.reasonTextSource} />
        </div>
      </div>

      {/* Main Title & Summary */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
          {pkg.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-1">{pkg.summary}</p>
      </div>

      {/* Reason text */}
      <div className="bg-slate-950/40 border border-slate-900/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed italic">
        "{pkg.reasonText}"
      </div>

      {/* Package details row */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
        <div className="flex items-center gap-3">
          <span>🕒 {t('duration', { hours: pkg.durationHours ?? 8 })}</span>
          <span>•</span>
          <span>🛣️ {t('stops', { count: pkg.items.length })}</span>
        </div>

        {/* Mini icons row */}
        <div className="flex gap-1">
          {pkg.items.slice(0, 4).map((item, idx) => (
            <span
              key={item.id}
              title={item.name}
              className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]"
            >
              {getItemIcon(item.itemType)}
            </span>
          ))}
        </div>
      </div>

      {/* CTA detail link */}
      <div className="pt-2">
        <Link
          href={`/${locale}/package/${pkg.packageId}`}
          className="block w-full text-center py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold tracking-wider transition-all"
          onClick={(e) => e.stopPropagation()} // Prevent card selection triggering
        >
          View Full Route Details →
        </Link>
      </div>
    </div>
  );
}
