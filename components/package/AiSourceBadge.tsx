'use client';

import { useTranslations } from 'next-intl';

interface AiSourceBadgeProps {
  source?: 'LLM_GENERATED' | 'TEMPLATE_FALLBACK' | 'MANUAL' | string;
}

export default function AiSourceBadge({ source = 'TEMPLATE_FALLBACK' }: AiSourceBadgeProps) {
  const t = useTranslations('ai');

  const configs: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    LLM_GENERATED: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400 border-purple-500/20',
      label: t('generatedBadge'),
      icon: '✨',
    },
    TEMPLATE_FALLBACK: {
      bg: 'bg-slate-800',
      text: 'text-slate-400 border-slate-700',
      label: t('officialBadge'),
      icon: '🏛️',
    },
    MANUAL: {
      bg: 'bg-pink-500/10',
      text: 'text-pink-400 border-pink-500/20',
      label: t('manualBadge'),
      icon: '👤',
    },
  };

  const current = configs[source] || configs.TEMPLATE_FALLBACK;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${current.bg} ${current.text} uppercase tracking-wider`}>
      <span>{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
}
