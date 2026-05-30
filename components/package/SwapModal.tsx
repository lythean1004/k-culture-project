'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PackageItem } from '@/lib/recommend/types';
import { ofetch } from 'ofetch';

interface SwapModalProps {
  packageId: string;
  cityCode?: string;
  itemIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectSwap: (item: PackageItem) => void;
}

export default function SwapModal({ packageId, cityCode, itemIndex, isOpen, onClose, onSelectSwap }: SwapModalProps) {
  const t = useTranslations('package');
  const [candidates, setCandidates] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen, hint]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await ofetch<{ success: boolean; data: PackageItem[] }>('/api/recommend/swap', {
        query: {
          packageId,
          city: cityCode,
          itemIndex,
          hint: hint === 'indoor' ? 'indoor' : undefined,
        },
      });
      if (res.success && res.data) {
        setCandidates(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch swap candidates:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal box */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 animate-fade-in duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">{t('swapModalTitle')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg focus:outline-none">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 my-4 leading-normal">
          {t('swapModalDesc')}
        </p>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setHint('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              hint === 'all'
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            All Stops
          </button>
          <button
            type="button"
            onClick={() => setHint('indoor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              hint === 'indoor'
                ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            🏠 Indoor Only
          </button>
        </div>

        {/* Candidates List */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading alternative locations...
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs border border-slate-800 border-dashed rounded-xl">
              No alternative candidates found.
            </div>
          ) : (
            candidates.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectSwap(item);
                  onClose();
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-purple-500 hover:bg-slate-900/40 transition cursor-pointer group"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mt-0.5">
                    {item.itemType}
                  </span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/10"
                >
                  Swap
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
