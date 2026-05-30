'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionStore } from '@/lib/store/session';
import { PackageItem, RecommendedPackage } from '@/lib/recommend/types';
import PackageTimeline from '@/components/package/PackageTimeline';
import CityMap from '@/components/map/CityMap';
import AiSourceBadge from '@/components/package/AiSourceBadge';
import WeatherWidget from '@/components/WeatherWidget';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import LicenseFooter from '@/components/LicenseFooter';
import { ofetch } from 'ofetch';
import Link from 'next/link';

interface PackageDetailPageProps {
  params: {
    packageId: string;
    locale: string;
  };
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { packageId, locale } = params;
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city');
  const citiesParam = searchParams.get('cities');
  const t = useTranslations('package');
  const tCommon = useTranslations('common');

  // Zustand State
  const { savedPackages, savePackage, unsavePackage, userSession } = useSessionStore();
  const isSaved = savedPackages.includes(packageId);

  // States
  const [pkg, setPkg] = useState<RecommendedPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [shareTooltip, setShareTooltip] = useState(false);

  // Weather state (mocked or loaded)
  const [weatherCode, setWeatherCode] = useState('Clear');
  const [tempC, setTempC] = useState(24);

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId, cityParam, citiesParam]);

  const fetchPackageDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const cacheBuster = new Date().getTime();
      const cityQuery = cityParam ? `&city=${encodeURIComponent(cityParam)}` : '';
      const citiesQuery = citiesParam ? `&cities=${encodeURIComponent(citiesParam)}` : '';
      const res = await ofetch<{ success: boolean; data: any; error?: string }>(`/api/packages/${packageId}?_t=${cacheBuster}${cityQuery}${citiesQuery}`);
      if (res.success && res.data) {
        setPkg(res.data);
        // Set weather based on city
        const cityCodes = res.data.cityCodes || [];
        const city = cityCodes[0] || res.data.cityName?.toLowerCase() || 'seoul';
        if (cityCodes.length > 1) {
          setWeatherCode('Variable');
          setTempC(22);
        } else if (city === 'namwon' || city === 'jeonju') {
          setWeatherCode('Cloudy');
          setTempC(21);
        } else if (city === 'gyeongju') {
          setWeatherCode('Rain');
          setTempC(18);
        }
      } else {
        throw new Error(res.error || 'Failed to fetch package details');
      }
    } catch (e: any) {
      console.error('Failed to load package details:', e);
      setError(e.message || 'An error occurred while loading');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItems = (newItems: PackageItem[]) => {
    if (!pkg) return;
    setPkg({
      ...pkg,
      items: newItems,
    });
  };

  const handleSaveToggle = async () => {
    if (isSaved) {
      unsavePackage(packageId);
    } else {
      savePackage(packageId);
      // Log save action to DB
      try {
        await ofetch('/api/recommend/log', {
          method: 'POST',
          body: {
            sessionId: userSession.sessionId,
            packageId,
            action: 'save',
          },
        });
      } catch (e) {
        console.error('Failed to log save action:', e);
      }
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading package details...</p>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4">
        <p className="text-red-400 text-sm">Failed to load package details: {error}</p>
        <Link href={`/${locale}`} className="text-xs text-purple-400 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  // Determine highlighted items for map based on hovered item from timeline
  const mapItems = hoveredIdx !== null ? [pkg.items[hoveredIdx]] : pkg.items;
  const packageCityCodes = pkg.cityCodes && pkg.cityCodes.length > 0 ? pkg.cityCodes : [pkg.cityName?.toLowerCase() || 'seoul'];
  const backHref = packageCityCodes.length > 1
    ? `/${locale}/city/multi?cities=${packageCityCodes.join(',')}${userSession.sessionId ? `&session=${userSession.sessionId}` : ''}`
    : `/${locale}/city/${packageCityCodes[0]}${userSession.sessionId ? `?session=${userSession.sessionId}` : ''}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              ✨ K-Culture
            </Link>
            <span className="text-xs text-slate-500 hidden sm:inline">
              🏙️ {pkg.cityName} Package Detailed Route
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
            >
              Back to List
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header Block: Title & ReasonText */}
        <div className="border border-slate-850 bg-slate-900/30 backdrop-blur-md rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold text-slate-100">
              {pkg.title}
            </h1>
            <div className="flex items-center gap-2">
              <AiSourceBadge source={pkg.reasonTextSource} />
              <span className="text-xs text-slate-400">🕒 {t('duration', { hours: pkg.durationHours ?? 8 })}</span>
            </div>
          </div>

          <div className="bg-purple-950/20 border border-purple-500/10 rounded-xl p-4 text-sm text-purple-200 leading-relaxed italic">
            "{pkg.reasonText}"
          </div>

          {/* Weather Alert inside Header */}
          <WeatherWidget currentWeather={weatherCode} tempC={tempC} />
        </div>

        {/* Dual Pane Timeline vs Sidebar Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Timeline */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-bold text-slate-200 px-1">Route Stop Timeline</h2>
            <PackageTimeline
              pkg={pkg}
              sessionId={userSession.sessionId}
              onUpdateItems={handleUpdateItems}
              onHoverItem={setHoveredIdx}
            />
          </div>

          {/* Right Panel: Map Sidebar */}
          <div className="lg:col-span-5 h-[400px] lg:h-[520px] sticky top-24">
            <div className="h-full rounded-2xl overflow-hidden border border-slate-800">
              <CityMap items={mapItems} cityCode={packageCityCodes[0]} cityCodes={packageCityCodes} />
            </div>
          </div>
        </div>

        {/* Bottom Save & Share Row */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-850">
          <button
            type="button"
            onClick={handleSaveToggle}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
              isSaved
                ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 shadow-emerald-500/5'
                : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isSaved ? '✓ ' + t('saved') : '💾 ' + t('save')}
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-500/10"
            >
              🔗 {t('share')}
            </button>
            
            {shareTooltip && (
              <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 whitespace-nowrap shadow-xl">
                {t('shareSuccess')}
              </div>
            )}
          </div>
        </div>
      </main>

      <LicenseFooter />
    </div>
  );
}
