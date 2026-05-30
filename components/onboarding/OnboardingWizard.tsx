'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionStore } from '@/lib/store/session';
import { ThemeCode, VisitForm } from '@/lib/recommend/types';
import { CITY_OPTIONS, CityCode, dayCountFromVisitForm, normalizeCityCode, normalizeCityCodes, visitFormFromDayCount } from '@/lib/recommend/cities';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { CalendarDays, MapPin, Route } from 'lucide-react';

interface OnboardingWizardProps {
  locale: string;
  initialCity?: string;
}

const cityList = CITY_OPTIONS;

const transportModes = [
  { code: 'WALK', emoji: '🚶' },
  { code: 'TRANSIT', emoji: '🚌' },
  { code: 'CAR', emoji: '🚗' },
] as const;

const interestsList: { code: ThemeCode; labelKey: string; emoji: string }[] = [
  { code: 'HISTORY', labelKey: 'history', emoji: '🏯' },
  { code: 'TRADITIONAL_MUSIC', labelKey: 'traditionalMusic', emoji: '🪕' },
  { code: 'MODERN_ART', labelKey: 'modernArt', emoji: '🎨' },
  { code: 'FAMILY', labelKey: 'family', emoji: '🎡' },
  { code: 'NIGHT', labelKey: 'night', emoji: '🌃' },
  { code: 'WELLNESS', labelKey: 'wellness', emoji: '🌿' },
  { code: 'FOOD', labelKey: 'food', emoji: '🍜' },
  { code: 'FESTIVAL', labelKey: 'festival', emoji: '🎉' },
];

export default function OnboardingWizard({ locale, initialCity }: OnboardingWizardProps) {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const { userSession, setSession } = useSessionStore();
  const [step, setStep] = useState(userSession.step || 1);
  const [loading, setLoading] = useState(false);
  const initialCityCode = normalizeCityCode(initialCity || userSession.cityCode);
  const initialSelectedCities = initialCity
    ? [initialCityCode]
    : normalizeCityCodes(userSession.cityCode, userSession.cityCodes);

  // States mirroring store inputs for wizard step validation
  const [selectedCities, setSelectedCities] = useState<CityCode[]>(initialSelectedCities);
  const [multiRegion, setMultiRegion] = useState(initialSelectedCities.length > 1);
  const [visitForm, setVisitForm] = useState<VisitForm>((userSession.visitForm as VisitForm) || 'DAY_TRIP');
  const [transportMode, setTransportMode] = useState(userSession.transportMode || 'TRANSIT');
  const [interests, setInterests] = useState<ThemeCode[]>(userSession.interests || []);
  const [freeTextQuery, setFreeTextQuery] = useState(userSession.freeTextQuery || '');
  const [consentLocation, setConsentLocation] = useState(false);
  const requestedDayCount = dayCountFromVisitForm(visitForm);
  const effectiveDayCount = Math.max(requestedDayCount, Math.min(selectedCities.length, 3)) as 1 | 2 | 3;
  const effectiveVisitForm = visitFormFromDayCount(effectiveDayCount);
  const selectedCity = selectedCities[0] || 'seoul';

  const syncWizardSession = (nextStep = step) => {
    setSession({
      step: nextStep,
      lang: locale as any,
      cityCode: selectedCity,
      cityCodes: selectedCities,
      tripDays: effectiveDayCount,
      visitForm: effectiveVisitForm,
      transportMode: transportMode as any,
      interests,
      freeTextQuery,
    });
  };

  useEffect(() => {
    if (initialCity) {
      const normalizedInitialCity = normalizeCityCode(initialCity);
      setSelectedCities([normalizedInitialCity]);
      setMultiRegion(false);
      setSession({ cityCode: normalizedInitialCity, cityCodes: [normalizedInitialCity] });
    }
  }, [initialCity, setSession]);

  const updateSelectedCities = (nextCities: CityCode[]) => {
    const normalizedCities = normalizeCityCodes(undefined, nextCities);
    setSelectedCities(normalizedCities);
    setSession({ cityCode: normalizedCities[0], cityCodes: normalizedCities });

    if (normalizedCities.length > requestedDayCount) {
      setVisitForm(visitFormFromDayCount(normalizedCities.length));
    }
  };

  const handleCitySelect = (cityCode: CityCode) => {
    if (!multiRegion) {
      updateSelectedCities([cityCode]);
      return;
    }

    const alreadySelected = selectedCities.includes(cityCode);
    const nextCities = alreadySelected
      ? selectedCities.filter(code => code !== cityCode)
      : [...selectedCities, cityCode].slice(0, 3);

    updateSelectedCities(nextCities.length > 0 ? nextCities : [cityCode]);
  };

  const handleMultiRegionToggle = (enabled: boolean) => {
    setMultiRegion(enabled);
    if (!enabled) {
      updateSelectedCities([selectedCity]);
    }
  };

  const buildResultPath = (sessionId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.set('session', sessionId);
    if (selectedCities.length > 1) params.set('cities', selectedCities.join(','));

    const routeCity = selectedCities.length > 1 ? 'multi' : selectedCity;
    const query = params.toString();
    return `/${locale}/city/${routeCity}${query ? `?${query}` : ''}`;
  };

  const handleNext = () => {
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      syncWizardSession(nextStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      syncWizardSession(prevStep);
    }
  };

  const toggleInterest = (code: ThemeCode) => {
    if (interests.includes(code)) {
      setInterests(interests.filter((i) => i !== code));
    } else {
      if (interests.length >= 3) return; // limit to 3 interests
      setInterests([...interests, code]);
    }
  };

  const handleComplete = async () => {
    if (interests.length === 0 && freeTextQuery.trim().length === 0) {
      alert('Please select at least 1 interest or enter what you want to do.');
      return;
    }
    
    setLoading(true);
    const sessionData = {
      lang: locale as any,
      cityCode: selectedCity,
      cityCodes: selectedCities,
      tripDays: effectiveDayCount,
      visitForm: effectiveVisitForm,
      interests,
      transportMode: transportMode as any,
      freeTextQuery,
      consentLocation,
    };

    // Save locally to store
    setSession(sessionData);

    // Save geolocation coordinates if consent location is checked
    let lat: number | undefined;
    let lng: number | undefined;
    if (consentLocation && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setSession({ currentLocation: { lat, lng } });
      } catch (e) {
        console.warn('Geolocation failed or timed out:', e);
      }
    }

    try {
      // POST session to server
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sessionData,
          currentLocation: lat && lng ? { lat, lng } : undefined,
        }),
      });
      const data = await res.json();
      
      if (data.success && data.sessionId) {
        setSession({ ...sessionData, sessionId: data.sessionId });
        // Redirect to city list page with session query param
        router.push(buildResultPath(data.sessionId));
      } else {
        throw new Error(data.error || 'Failed to initialize session');
      }
    } catch (e: any) {
      console.error('Onboarding failed:', e);
      alert(`Failed to save session. Moving to recommendation list directly. Error details: ${e.message}`);
      router.push(buildResultPath());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Top Indicators */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
              }`}
            ></div>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-400">Step {step} of 4</span>
      </div>

      {/* Step 1: Language */}
      {step === 1 && (
        <div className="space-y-6 py-4 animate-fade-in duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">{t('step1.title')}</h2>
            <p className="text-sm text-slate-400">{t('step1.description')}</p>
          </div>
          <div className="flex justify-center py-6">
            <LanguageSwitcher />
          </div>
        </div>
      )}

      {/* Step 2: City Choice */}
      {step === 2 && (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">{t('step2.title')}</h2>
            <p className="text-sm text-slate-400">{t('step2.description')}</p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => handleMultiRegionToggle(false)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${
                !multiRegion
                  ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Single city
            </button>
            <button
              type="button"
              onClick={() => handleMultiRegionToggle(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition ${
                multiRegion
                  ? 'bg-pink-600/20 border-pink-500 text-pink-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Route className="w-4 h-4" />
              Multi-region
            </button>
          </div>

          <div className="relative h-[430px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(168,85,247,0.18),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.65))]"></div>
            <div className="absolute inset-x-12 top-8 bottom-8 rounded-[42%] border border-slate-700/70 bg-slate-900/40"></div>
            <div className="absolute left-[42%] top-[18%] h-[56%] border-l border-dashed border-slate-600/80 rotate-[16deg]"></div>
            <div className="absolute left-[48%] top-[52%] w-[30%] border-t border-dashed border-slate-600/80 rotate-[12deg]"></div>

            {cityList.map((city) => {
              const isSelected = selectedCities.includes(city.code);
              return (
              <button
                key={city.code}
                type="button"
                onClick={() => handleCitySelect(city.code)}
                title={`${city.name} · ${city.nameKo} · ${city.hubLabel}`}
                aria-label={`Select ${city.name}`}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                  isSelected
                    ? 'z-20 scale-110 border-purple-300 bg-purple-500 text-white shadow-purple-500/30'
                    : 'z-10 border-slate-600 bg-slate-950/90 text-slate-300 hover:z-20 hover:border-slate-300 hover:bg-slate-800'
                }`}
                style={{ left: `${city.mapX}%`, top: `${city.mapY}%` }}
              >
                <MapPin className="m-auto h-4 w-4" />
                <span
                  className={`pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold shadow-xl transition-opacity ${
                    isSelected
                      ? 'border-purple-400 bg-slate-950 text-purple-100 opacity-100'
                      : 'border-slate-700 bg-slate-950 text-slate-200 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {city.name}
                </span>
              </button>
              );
            })}
          </div>

          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-6">
            {cityList.map((city) => {
              const isSelected = selectedCities.includes(city.code);
              return (
                <button
                  key={city.code}
                  type="button"
                  onClick={() => handleCitySelect(city.code)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    isSelected
                      ? 'border-purple-400 bg-purple-600/20 text-purple-100'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="block text-xs font-bold">{city.name}</span>
                  <span className="block truncate text-[10px] text-slate-500">{city.nameKo} · {city.hubLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {selectedCities.map((cityCode, index) => {
              const city = cityList.find(item => item.code === cityCode);
              return (
                <span key={cityCode} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  Day {Math.min(index + 1, 3)} · {city?.name || cityCode}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Visit Form & Transport */}
      {step === 3 && (
        <div className="space-y-8 py-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">{t('step3.title')}</h2>
            <p className="text-sm text-slate-400">{t('step3.description')}</p>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 block">{t('step3.visitFormLabel')}</label>
            <div className="grid grid-cols-3 gap-4">
              {(['DAY_TRIP', 'STAY_1_3', 'THEME_TOUR'] as VisitForm[]).map((form) => {
                const dayCount = dayCountFromVisitForm(form);
                const disabled = dayCount < selectedCities.length;
                const label = `${dayCount}-Day Course`;
                return (
                  <button
                    key={form}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setVisitForm(form)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      visitForm === form
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                        : disabled
                          ? 'bg-slate-950/20 border-slate-900 text-slate-700 cursor-not-allowed'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-300 block">{t('step3.transportLabel')}</label>
            <div className="grid grid-cols-3 gap-4">
              {transportModes.map((m) => {
                const label = t(`step3.${m.code}`);
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => setTransportMode(m.code)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      transportMode === m.code
                        ? 'bg-pink-600/20 border-pink-500 text-pink-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Interests & Completed */}
      {step === 4 && (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">{t('step4.title')}</h2>
            <p className="text-sm text-slate-400">{t('step4.description')}</p>
          </div>

          {/* Interests Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            {interestsList.map((interest) => {
              const isSelected = interests.includes(interest.code);
              return (
                <button
                  key={interest.code}
                  type="button"
                  onClick={() => toggleInterest(interest.code)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500 text-purple-200 scale-105'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{interest.emoji}</span>
                  <span className="text-xs font-semibold">{t(`step4.${interest.labelKey}`)}</span>
                </button>
              );
            })}
          </div>

          {/* Free Text Input */}
          <div className="space-y-2">
            <textarea
              value={freeTextQuery}
              onChange={(e) => setFreeTextQuery(e.target.value)}
              placeholder={t('step4.freeTextHint')}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all h-20 resize-none"
            />
          </div>

          {/* Consent Location Checkbox */}
          <div className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              id="consent-location"
              checked={consentLocation}
              onChange={(e) => setConsentLocation(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500 h-4 w-4 transition-all"
            />
            <label htmlFor="consent-location" className="text-xs text-slate-400 cursor-pointer select-none">
              {t('step4.locationConsent')}
            </label>
          </div>
        </div>
      )}

      {/* Bottom Nav Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || loading}
          className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            step === 1 || loading
              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
              : 'border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300'
          }`}
        >
          {tCommon('back')}
        </button>

        {step === 4 ? (
          <button
            type="button"
            onClick={handleComplete}
            disabled={(interests.length === 0 && freeTextQuery.trim().length === 0) || loading}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              (interests.length === 0 && freeTextQuery.trim().length === 0) || loading
                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {loading ? 'Generating...' : t('step4.complete')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 transition-all"
          >
            {tCommon('next')}
          </button>
        )}
      </div>
    </div>
  );
}
