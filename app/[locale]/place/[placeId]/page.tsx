'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ofetch } from 'ofetch';
import Link from 'next/link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import LicenseFooter from '@/components/LicenseFooter';

interface PlaceDetailPageProps {
  params: {
    placeId: string;
    locale: string;
  };
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId, locale } = params;
  const tCommon = useTranslations('common');

  const [place, setPlace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOriginalDesc, setShowOriginalDesc] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ofetch<{ success: boolean; data: any; error?: string }>(`/api/places/${placeId}`);
      if (res.success && res.data) {
        setPlace(res.data);
      } else {
        throw new Error(res.error || 'Failed to fetch place details');
      }
    } catch (e: any) {
      console.error('Failed to load place details:', e);
      setError(e.message || 'An error occurred while loading');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading place details...</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4">
        <p className="text-red-400 text-sm">Failed to load place details: {error}</p>
        <Link href={`/${locale}`} className="text-xs text-purple-400 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const translatedName = typeof place.nameTranslated === 'object' 
    ? place.nameTranslated[locale] || place.nameTranslated.en || place.nameKo
    : place.nameTranslated || place.nameKo;

  const translatedDesc = place.descriptions[locale] || place.descriptions.en || 'No description available in this language.';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="w-full border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            ✨ K-Culture
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Block */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Title Block */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
            🏛️ {place.primaryType}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            {translatedName}
          </h1>
          <p className="text-sm text-slate-400 font-mono flex items-center gap-1.5">
            📍 {place.addrKo}
          </p>
        </div>

        {/* Gallery Section */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/40 h-80 sm:h-96 shadow-2xl">
          {place.imageUrls && place.imageUrls.length > 0 ? (
            <>
              <img
                src={place.imageUrls[activeImageIdx]}
                alt={translatedName}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4 flex justify-between items-center">
                {/* License watermark complying with TourAPI rules */}
                <span className="text-[9px] text-slate-400 font-semibold">
                  Source: TourAPI (Ministry of Culture, Sports and Tourism of Korea)
                </span>
                
                {/* Thumb indicators */}
                <div className="flex gap-2">
                  {place.imageUrls.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeImageIdx === idx ? 'bg-purple-500 scale-125' : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                    ></button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              No gallery images available
            </div>
          )}
        </div>

        {/* Curation Description Block */}
        <div className="bg-slate-905 border border-slate-850 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-purple-300">Spot Description</h3>
            <button
              onClick={() => setShowOriginalDesc(!showOriginalDesc)}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
            >
              {showOriginalDesc ? 'Show English Description' : 'Show Original (Korean)'}
            </button>
          </div>

          <div className="text-slate-300 leading-relaxed text-sm">
            {showOriginalDesc ? (
              <p className="font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                한국어 설명 원문: <br />
                {place.descriptions.ko || '한국어 설명 정보가 없습니다.'}
              </p>
            ) : (
              <p>{translatedDesc}</p>
            )}
          </div>
        </div>

        {/* Operating Hours & Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Operating Hours Table */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">🕰️ Opening Hours</h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {place.operatingHours?.map((row: any) => (
                    <tr key={row.day} className="hover:bg-slate-900/20">
                      <td className="p-3 font-semibold text-slate-300">{row.day}</td>
                      <td className="p-3 text-slate-400">{row.closed ? '-' : `${row.open} - ${row.close}`}</td>
                      <td className="p-3 text-right">
                        {row.closed ? (
                          <span className="text-amber-500 font-medium">Closed</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Open</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Contact & Quick Links */}
          <div className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-200">📞 Contact & Links</h3>
              <div className="space-y-3 text-xs text-slate-300">
                {place.phone && <p>📞 Phone: {place.phone}</p>}
                {place.officialUrl && (
                  <p>
                    🌐 Official Website:{' '}
                    <a
                      href={place.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline font-semibold"
                    >
                      {place.officialUrl} ↗
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Related Events */}
            {place.relatedEvents && place.relatedEvents.length > 0 && (
              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-200">🎭 Events at this Spot</h3>
                <div className="space-y-3">
                  {place.relatedEvents.map((evt: any) => (
                    <div key={evt.eventId} className="border border-slate-800 bg-slate-950/40 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{evt.title}</h4>
                        <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mt-1">
                          {evt.genre}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded">
                        {evt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nearby Attractions (1km) */}
        {place.nearbyRecommendations && place.nearbyRecommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-200 px-1">🚶 Nearby Attractions (within 1km)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {place.nearbyRecommendations.map((near: any) => (
                <Link
                  href={`/${locale}/place/${near.placeId}`}
                  key={near.placeId}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-purple-500 hover:bg-slate-900/40 transition flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
                      {near.nameTranslated}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                      {near.primaryType}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                    Explore →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <LicenseFooter />
    </div>
  );
}
