'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionStore } from '@/lib/store/session';
import { useRecommendation } from '@/lib/queries/recommend';
import { RecommendInput, RecommendedPackage, ThemeCode } from '@/lib/recommend/types';
import PackageCard from '@/components/package/PackageCard';
import CityMap from '@/components/map/CityMap';
import WeatherWidget from '@/components/WeatherWidget';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import LicenseFooter from '@/components/LicenseFooter';
import Link from 'next/link';

interface CityPageProps {
  params: {
    cityCode: string;
    locale: string;
  };
}

function CityPageContent({ cityCode, locale }: { cityCode: string, locale: string }) {
  const t = useTranslations('package');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || undefined;

  const { userSession } = useSessionStore();

  // Selected package in the list to highlight in the map
  const [selectedPkg, setSelectedPkg] = useState<RecommendedPackage | null>(null);

  // If Zustand store is empty (e.g. page refresh), we construct a fallback recommend input based on URL
  const recommendInput: RecommendInput = {
    sessionId,
    cityCode,
    visitForm: userSession.visitForm || 'DAY_TRIP',
    interests: (userSession.interests && userSession.interests.length > 0)
      ? userSession.interests
      : ['HISTORY' as ThemeCode],
    freeTextQuery: userSession.freeTextQuery || '',
    lang: (locale as any) || 'en',
    transportMode: userSession.transportMode || 'TRANSIT',
    currentLocation: userSession.currentLocation,
  };

  const { data, isLoading, error } = useRecommendation(recommendInput);

  // Default sorted packages by totalScore desc
  const sortedPackages = data?.packages 
    ? [...data.packages].sort((a, b) => b.totalScore - a.totalScore) 
    : [];

  useEffect(() => {
    if (sortedPackages.length > 0 && !selectedPkg) {
      setSelectedPkg(sortedPackages[0]);
    }
  }, [sortedPackages, selectedPkg]);

  // Mock weather state
  const [weatherCode, setWeatherCode] = useState('Clear');
  const [tempC, setTempC] = useState(24);

  useEffect(() => {
    // If city is Namwon or Jeonju, mock slightly different weather
    if (cityCode === 'namwon' || cityCode === 'jeonju') {
      setWeatherCode('Cloudy');
      setTempC(21);
    } else if (cityCode === 'gyeongju') {
      setWeatherCode('Rain');
      setTempC(18);
    }
  }, [cityCode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              ✨ K-Culture
            </Link>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              Session: {sessionId?.slice(0, 8) || 'local'}...
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/onboarding`}
              className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Modify Plan
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* City Title & Weather Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-4xl font-extrabold capitalize text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-100 to-indigo-200">
              {cityCode} Cultural Packages
            </h1>
            <p className="text-slate-400 mt-1">
              Curated combinations of museums, performances, attractions in {cityCode}
            </p>
          </div>
          <div className="w-full md:w-auto md:min-w-[320px]">
            <WeatherWidget currentWeather={weatherCode} tempC={tempC} />
          </div>
        </div>

        {/* Dual Pane Layout (Cards List vs Map) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Packages List */}
          <div className="lg:col-span-5 space-y-6">
            {isLoading ? (
              <div className="space-y-4 py-8 text-center text-slate-500">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm">Finding best matches for your cultural journey...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">Failed to load packages. Please modify your interests and try again.</p>
              </div>
            ) : sortedPackages.length === 0 ? (
              <div className="border border-slate-800 border-dashed rounded-xl p-8 text-center text-slate-500">
                <p>No matching packages found.</p>
                <Link href={`/${locale}/onboarding`} className="text-purple-400 text-xs font-semibold hover:underline block mt-2">
                  Reset interests in onboarding wizard →
                </Link>
              </div>
            ) : (
              <div className="space-y-4 h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                {sortedPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.packageId}
                    pkg={pkg}
                    locale={locale}
                    isSelected={selectedPkg?.packageId === pkg.packageId}
                    onSelect={() => setSelectedPkg(pkg)}
                  />
                ))}

                {/* Show more themes Button */}
                <div className="pt-4 text-center">
                  <Link
                    href={`/${locale}/onboarding`}
                    className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition text-xs font-bold"
                  >
                    ➕ {t('showMoreThemes')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: Map Pane (Sticky) */}
          <div className="lg:col-span-7 h-[500px] lg:h-[calc(100vh-240px)] sticky top-24">
            <CityMap items={selectedPkg?.items || []} cityCode={cityCode} />
          </div>
        </div>
      </main>

      <LicenseFooter />
    </div>
  );
}

export default function CityPage({ params }: CityPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CityPageContent cityCode={params.cityCode} locale={params.locale} />
    </Suspense>
  );
}
