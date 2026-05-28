'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionStore } from '@/lib/store/session';
import { ThemeCode, VisitForm } from '@/lib/recommend/types';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

interface OnboardingWizardProps {
  locale: string;
  initialCity?: string;
}

const cityList = [
  { code: 'seoul', name: 'Seoul', nameKo: '서울', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=300&q=80' },
  { code: 'busan', name: 'Busan', nameKo: '부산', img: 'https://images.unsplash.com/photo-1578840602674-bd891cb7ea5b?auto=format&fit=crop&w=300&q=80' },
  { code: 'gyeongju', name: 'Gyeongju', nameKo: '경주', img: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&w=300&q=80' },
  { code: 'jeonju', name: 'Jeonju', nameKo: '전주', img: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=300&q=80' },
  { code: 'namwon', name: 'Namwon', nameKo: '남원', img: 'https://images.unsplash.com/photo-1616058097781-80bb6e2a76f6?auto=format&fit=crop&w=300&q=80' },
];

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

  // States mirroring store inputs for wizard step validation
  const [selectedCity, setSelectedCity] = useState(initialCity || userSession.cityCode || 'seoul');
  const [visitForm, setVisitForm] = useState<VisitForm>((userSession.visitForm as VisitForm) || 'DAY_TRIP');
  const [transportMode, setTransportMode] = useState(userSession.transportMode || 'TRANSIT');
  const [interests, setInterests] = useState<ThemeCode[]>(userSession.interests || []);
  const [freeTextQuery, setFreeTextQuery] = useState(userSession.freeTextQuery || '');
  const [consentLocation, setConsentLocation] = useState(false);

  useEffect(() => {
    if (initialCity) {
      setSelectedCity(initialCity);
      setSession({ cityCode: initialCity });
    }
  }, [initialCity, setSession]);

  const handleNext = () => {
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      setSession({ step: nextStep });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      setSession({ step: prevStep });
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
      visitForm,
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
        // Redirect to city list page with session query param
        router.push(`/${locale}/city/${selectedCity}?session=${data.sessionId}`);
      } else {
        throw new Error(data.error || 'Failed to initialize session');
      }
    } catch (e: any) {
      console.error('Onboarding failed:', e);
      alert('Failed to save session. Moving to recommendation list directly.');
      router.push(`/${locale}/city/${selectedCity}`);
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4">
            {cityList.map((city) => (
              <button
                key={city.code}
                type="button"
                onClick={() => setSelectedCity(city.code)}
                className={`relative rounded-xl overflow-hidden border-2 h-36 flex flex-col justify-end p-3 transition-all duration-300 ${
                  selectedCity === city.code
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20 scale-105'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img src={city.img} alt={city.name} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="relative z-10 text-left">
                  <h4 className="font-bold text-sm text-white">{city.name}</h4>
                  <p className="text-[10px] text-slate-300">{city.nameKo}</p>
                </div>
              </button>
            ))}
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
                const label = form === 'DAY_TRIP' ? t('step3.dayTrip') : form === 'STAY_1_3' ? t('step3.stay13') : t('step3.themeTour');
                return (
                  <button
                    key={form}
                    type="button"
                    onClick={() => setVisitForm(form)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      visitForm === form
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
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
